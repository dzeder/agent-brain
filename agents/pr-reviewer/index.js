#!/usr/bin/env node
/**
 * PR Review Agent — entrypoint invoked by .github/workflows/pr-review.yml.
 *
 * Reads PR metadata + diff from disk (the workflow stages them), calls the
 * Anthropic API with the live system prompt, expects a signed-output JSON
 * payload, and writes the rendered comment + verdict to disk for the
 * workflow to post.
 *
 * Inputs (paths supplied via env):
 *   PR_DIFF_PATH          — full unified diff of the PR
 *   PR_METADATA_PATH      — JSON: {number, title, body, author, labels[], base_ref, head_sha}
 *   ANTI_DRIFT_TEMPLATE   — path to .github/PULL_REQUEST_TEMPLATE.md
 *   SYSTEM_PROMPT_PATH    — defaults to ./pr-reviewer-v1.0.0.md
 *   ANTHROPIC_API_KEY     — required
 *   MODEL                 — defaults to claude-sonnet-4-6
 *   MAX_TOKENS            — defaults to 4096
 *
 * Outputs (paths supplied via env):
 *   OUTPUT_PATH           — full signed-output JSON
 *   COMMENT_PATH          — rendered markdown comment to post
 *   VERDICT_PATH          — single-word: "pass" | "fail" | "escalate"
 *
 * Retry policy: 2 retries with 30s backoff on API timeout / 5xx. On
 * exhaustion, exits non-zero — the workflow then posts a "human review
 * required" fallback.
 *
 * NOT IN SCOPE for this entrypoint:
 *   - Calling GitHub (the workflow does that with GITHUB_TOKEN).
 *   - Modifying repo state.
 *   - Approving / merging PRs.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const PROTECTED_PATHS = [
  /^agents\/pr-reviewer\//,
  /^standards\//,
  /^AGENT_PRODUCT_CYCLE\.md$/,
  /^CLAUDE\.md$/,
];

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 8192;  // bumped from 4096 — large PRs were truncating
const RETRY_BACKOFF_MS = 30_000;
const MAX_RETRIES = 2;

// Diff compaction. PR #13 (M2 baseline) sent 3.6MB of baseline.json content
// → 1.28M tokens → context-window overflow. Big "data" files don't need
// line-by-line review; show the agent a summary stub instead.
const ELIDABLE_PATH_PATTERNS = [
  /\.baseline\.json$/,            // committed baseline reference (M2)
  /\.results\.json$/,             // per-run promptfoo output (shouldn't be committed but defensive)
  /(^|\/)package-lock\.json$/,    // npm lockfile
  /(^|\/)yarn\.lock$/,
  /(^|\/)Cargo\.lock$/,
  /(^|\/)Gemfile\.lock$/,
  /(^|\/)go\.sum$/,
  /(^|\/)poetry\.lock$/,
  /\.min\.(js|css)$/,             // pre-minified
];

const PER_FILE_BYTE_LIMIT = 50_000;       // any single-file chunk over this is summarized
const TOTAL_DIFF_BYTE_LIMIT = 1_500_000;  // ~375K tokens at ~4B/token; leaves room for prompt + reply

function readEnvPath(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function stripPromptHeader(content) {
  return content.replace(/^<!--[\s\S]*?-->\s*\n/, '').trim();
}

function detectProtectedPath(diff) {
  // Naive check: scan diff headers for protected path matches. The agent
  // double-checks but the workflow uses this hint to decide whether to
  // trust the agent's verdict at all.
  const fileLines = diff.match(/^\+\+\+ b\/(\S+)/gm) || [];
  const files = fileLines.map((l) => l.replace(/^\+\+\+ b\//, ''));
  const matches = files.filter((f) =>
    PROTECTED_PATHS.some((re) => re.test(f))
  );
  return { isProtected: matches.length > 0, matchedFiles: matches };
}

function compactDiff(diff) {
  // Split the unified diff into per-file chunks, then keep small/relevant
  // chunks verbatim and replace large or "data" chunks with summary stubs.
  // The original full diff is still uploaded as a workflow artifact for
  // post-mortem; the agent just doesn't see those bytes during review.
  const chunks = diff.split(/(?=^diff --git )/m);
  const compacted = [];
  let totalBytes = 0;
  let truncated = false;
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const fileMatch = chunk.match(/^diff --git a\/(\S+) b\/(\S+)/m);
    const filePath = fileMatch ? fileMatch[2] : '<unknown>';
    const matchedPattern = ELIDABLE_PATH_PATTERNS.find((p) => p.test(filePath));
    const oversize = chunk.length > PER_FILE_BYTE_LIMIT;

    let entry;
    if (matchedPattern || oversize) {
      // Count line markers excluding headers (`+++`/`---` count once each).
      const insertions = ((chunk.match(/^\+/gm) || []).length - 1) | 0;
      const deletions = ((chunk.match(/^-/gm) || []).length - 1) | 0;
      const reason = matchedPattern
        ? `matches data-file pattern ${matchedPattern}`
        : `chunk size ${chunk.length} bytes > ${PER_FILE_BYTE_LIMIT}`;
      // Preserve everything from `diff --git` through the last header
      // line before the first @@-hunk (covers index/mode/`--- a/`/`+++ b/`)
      // so detectProtectedPath and header-aware tooling still see file
      // paths and the elision is unambiguously a content elision, not a
      // metadata one.
      const headerMatch = chunk.match(
        /^diff --git[^\n]*\n(?:(?!@@)[^\n]*\n)*/
      );
      const header = headerMatch ? headerMatch[0] : `diff --git a/${filePath} b/${filePath}\n`;
      entry =
        header +
        `[ELIDED-FOR-AGENT-CONTEXT: +${insertions} -${deletions} lines. ` +
        `Reason: ${reason}. Full diff in the pr-review workflow artifact.]\n`;
    } else {
      entry = chunk;
    }

    if (totalBytes + entry.length > TOTAL_DIFF_BYTE_LIMIT) {
      compacted.push(
        `\n[DIFF TRUNCATED-FOR-AGENT-CONTEXT: cumulative size exceeds ${TOTAL_DIFF_BYTE_LIMIT} bytes. ` +
          `Subsequent files not shown to the agent. Full diff in workflow artifact.]\n`
      );
      truncated = true;
      break;
    }
    compacted.push(entry);
    totalBytes += entry.length;
  }
  return { compacted: compacted.join(''), truncated, totalBytes };
}

async function callClaude({ apiKey, model, maxTokens, systemPrompt, userInput }) {
  const client = new Anthropic({ apiKey });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userInput }],
      });
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      return { text, usage: response.usage, model: response.model };
    } catch (err) {
      const isRetryable =
        err.status === undefined || err.status >= 500 || err.status === 429;
      if (attempt < MAX_RETRIES && isRetryable) {
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
        continue;
      }
      throw err;
    }
  }
}

function parseSignedOutput(text) {
  // Robust JSON extraction. The model is instructed to emit only the JSON
  // object, but in practice it sometimes wraps in code fences or adds a
  // preamble/coda ("Here is the review:" ... "Let me know..."). Find the
  // first `{` and walk the brace tree, respecting string boundaries and
  // escapes, so we extract the outermost JSON object cleanly regardless
  // of surrounding prose.
  const start = text.indexOf('{');
  if (start === -1) {
    throw new Error('No `{` found in agent output — model returned no JSON.');
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }
  throw new Error(
    'Unmatched braces in agent output — JSON object did not close before end of response (likely truncated by max_tokens).'
  );
}

const DIMENSION_ORDER = [
  'structure',
  'secrets',
  'scope',
  'intent',
  'prompt_drift',
  'api_contract',
  'documentation',
  'escalation',
];

const VERDICT_EMOJI = {
  pass: ':white_check_mark:',
  fail: ':x:',
  skip: ':white_circle:',
  human_review_required: ':bell:',
};

function renderCommentFromOutput(output) {
  // Build a deterministic markdown comment from the structured signed-output
  // payload. Used when the agent returned a valid JSON object without a
  // populated `comment_markdown`. Keeps PR comments useful even when the
  // model under-renders the prose section.
  const lines = [];
  const verdict = output.verdict ?? 'escalate';
  const verdictBadge =
    verdict === 'pass' ? ':white_check_mark: PASS' :
    verdict === 'fail' ? ':x: FAIL' : ':bell: ESCALATE';
  lines.push(`### ${verdictBadge}`);
  lines.push('');

  if (output.human_review_required) {
    lines.push('**Human review required.**');
    if (Array.isArray(output.human_review_reasons) && output.human_review_reasons.length > 0) {
      for (const reason of output.human_review_reasons) {
        lines.push(`- ${reason}`);
      }
    }
    lines.push('');
  }

  if (output.dimensions && typeof output.dimensions === 'object') {
    const rows = [];
    DIMENSION_ORDER.forEach((dim, idx) => {
      const d = output.dimensions[dim];
      if (!d) return;
      const v = d.verdict ?? '?';
      const emoji = VERDICT_EMOJI[v] ?? '';
      const notes = (d.notes ?? '').replace(/\|/g, '\\|').slice(0, 200);
      rows.push(`| ${idx + 1} | ${dim} | ${emoji} ${v} | ${notes} |`);
    });
    if (rows.length > 0) {
      lines.push('### Dimensions');
      lines.push('');
      lines.push('| # | Dimension | Verdict | Notes |');
      lines.push('|---|-----------|---------|-------|');
      lines.push(...rows);
      lines.push('');
    }
  }

  if (Array.isArray(output.blocking_issues) && output.blocking_issues.length > 0) {
    lines.push('### Blocking issues');
    lines.push('');
    for (const issue of output.blocking_issues) {
      const loc = issue.file
        ? (issue.line ? `\`${issue.file}:${issue.line}\`` : `\`${issue.file}\``)
        : '';
      lines.push(`- **${issue.dimension ?? '?'}** ${loc} — ${issue.rule ?? ''}`);
      if (issue.evidence) lines.push(`  - evidence: ${issue.evidence}`);
      if (issue.fix) lines.push(`  - fix: ${issue.fix}`);
    }
    lines.push('');
  }

  if (lines.length === 1) {
    // Output had nothing beyond the verdict; emit an honest minimal comment.
    lines.push('');
    lines.push('_(Agent returned a structured verdict but no per-dimension detail. See the workflow artifact for the full signed-output JSON.)_');
  }

  return lines.join('\n');
}

function buildUserMessage({ metadata, diff, antiDriftTemplate, protectedHint }) {
  return [
    `<pr_metadata>\n${JSON.stringify(metadata, null, 2)}\n</pr_metadata>`,
    `<protected_path_hint>\n${JSON.stringify(protectedHint, null, 2)}\n</protected_path_hint>`,
    `<anti_drift_checklist>\n${antiDriftTemplate}\n</anti_drift_checklist>`,
    `<pr_diff>\n${diff}\n</pr_diff>`,
    'Review the PR per the eight dimensions in your prompt. Emit ONLY the signed-output JSON object as specified in <output_format>. Do not include any prose outside the JSON.',
  ].join('\n\n');
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required');

  const diffPath = readEnvPath('PR_DIFF_PATH');
  const metadataPath = readEnvPath('PR_METADATA_PATH');
  const antiDriftPath = readEnvPath('ANTI_DRIFT_TEMPLATE');
  const systemPromptPath =
    process.env.SYSTEM_PROMPT_PATH ??
    path.resolve(__dirname, 'pr-reviewer-v1.0.0.md');
  const outputPath = readEnvPath('OUTPUT_PATH');
  const commentPath = readEnvPath('COMMENT_PATH');
  const verdictPath = readEnvPath('VERDICT_PATH');

  const model = process.env.MODEL ?? DEFAULT_MODEL;
  const maxTokens = Number(process.env.MAX_TOKENS ?? DEFAULT_MAX_TOKENS);

  const rawDiff = readFile(diffPath);
  const metadata = JSON.parse(readFile(metadataPath));
  const antiDriftTemplate = readFile(antiDriftPath);
  const systemPrompt = stripPromptHeader(readFile(systemPromptPath));

  // Detect protected paths on the FULL diff (before compaction) so the
  // recursion-rule backstop is never weaker than the agent's view.
  const protectedHint = detectProtectedPath(rawDiff);

  // Compact the diff before sending to the LLM. Big "data" files
  // (baseline.json, lockfiles, minified) get summary stubs; everything
  // else passes through verbatim. The full original diff stays in the
  // workflow artifact for post-mortem.
  const { compacted: diff, truncated, totalBytes } = compactDiff(rawDiff);
  if (truncated) {
    console.error(
      `[pr-reviewer] Diff was truncated to fit context budget. Original: ${rawDiff.length} bytes; compacted: ${totalBytes} bytes.`
    );
  }

  const userInput = buildUserMessage({
    metadata,
    diff,
    antiDriftTemplate,
    protectedHint,
  });

  const startedAt = Date.now();
  const { text, usage, model: reportedModel } = await callClaude({
    apiKey,
    model,
    maxTokens,
    systemPrompt,
    userInput,
  });
  const latencyMs = Date.now() - startedAt;

  let payload;
  try {
    payload = parseSignedOutput(text);
  } catch (err) {
    // Agent failed to produce parseable JSON. Surface as flagged signed-output.
    payload = {
      task_id: `pr-${metadata.number}`,
      status: 'flagged',
      confidence: 0,
      output: {
        pr_number: metadata.number,
        head_sha: metadata.head_sha,
        verdict: 'escalate',
        human_review_required: true,
        human_review_reasons: [
          'agent_output_parse_failure: agent did not return valid JSON; raw output preserved in workflow logs',
        ],
        comment_markdown:
          ':warning: PR review agent did not return parseable JSON. Falling back to human review. See workflow logs for raw output.',
      },
      self_assessment: {
        completed_all_requirements: false,
        followed_output_format: false,
        flagged_uncertainty: true,
        tool_failures_encountered: false,
        assumptions_made: [],
        flags: [
          {
            type: 'output_parse_failure',
            detail: err.message,
            raw_output_first_2k_chars: text.slice(0, 2000),
            raw_output_last_500_chars: text.slice(-500),
            raw_output_length: text.length,
          },
        ],
      },
      reflection: {
        what_i_did: 'Attempted PR review; output unparseable.',
        what_worked: 'API call succeeded.',
        what_i_struggled_with: `JSON parse failed: ${err.message}`,
        what_id_do_differently:
          'Tighten output_format constraints; consider structured-output schema enforcement at API layer.',
        confidence_was_accurate: 'n/a',
        coaching_applied: null,
        coaching_helped: 'n/a',
      },
      execution_metadata: {
        tool_calls: [],
        token_usage: usage ?? {},
        latency_ms: latencyMs,
        model: reportedModel ?? model,
        prompt_version: '1.0.0',
      },
    };
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    fs.writeFileSync(commentPath, payload.output.comment_markdown);
    fs.writeFileSync(verdictPath, 'escalate');
    process.exit(0);
  }

  // Wrap the agent's payload in the signed-output envelope (if not already).
  const signed = payload.task_id
    ? payload
    : {
        task_id: `pr-${metadata.number}`,
        status: 'complete',
        confidence: 0.9,
        output: payload,
        self_assessment: {
          completed_all_requirements: true,
          followed_output_format: true,
          flagged_uncertainty: false,
          tool_failures_encountered: false,
          assumptions_made: [],
          flags: [],
        },
        reflection: {
          what_i_did: `Reviewed PR #${metadata.number} against 8 dimensions.`,
          what_worked: 'Single API call; structured JSON returned.',
          what_i_struggled_with: '',
          what_id_do_differently: '',
          confidence_was_accurate: 'uncertain',
          coaching_applied: null,
          coaching_helped: 'n/a',
        },
        execution_metadata: {
          tool_calls: [],
          token_usage: usage ?? {},
          latency_ms: latencyMs,
          model: reportedModel ?? model,
          prompt_version: '1.0.0',
        },
      };

  // Some agent outputs double-nest the review: signed.output ends up as a
  // metadata wrapper (schema, message_type, agent_id, version,
  // comment_markdown) with the actual review at signed.output.output. The
  // prompt's <output_format> example arguably invites this — the model
  // mistakes "use the signed-output schema with message_type: output" for
  // "wrap the review in a metadata envelope". Detect and unwrap so verdict
  // / dimensions / blocking_issues sit where the renderer expects them.
  if (
    signed.output &&
    typeof signed.output === 'object' &&
    !signed.output.verdict &&
    signed.output.output &&
    typeof signed.output.output === 'object' &&
    signed.output.output.verdict
  ) {
    const outerCommentMarkdown = signed.output.comment_markdown;
    const inner = signed.output.output;
    signed.output = inner;
    // Prefer the agent's outer comment_markdown only if it's substantive
    // (>120 chars). The agent often emits a bare "### :bell: ESCALATE"
    // header at the wrapper level when the real review is nested; in that
    // case we want the renderer to build a useful comment from the inner
    // dimensions/issues instead.
    if (
      typeof outerCommentMarkdown === 'string' &&
      outerCommentMarkdown.trim().length >= 120 &&
      !signed.output.comment_markdown
    ) {
      signed.output.comment_markdown = outerCommentMarkdown;
    }
  }

  // Apply the recursion rule as a backstop: if the diff touched a protected
  // path, force escalate regardless of agent verdict.
  if (protectedHint.isProtected) {
    signed.output.verdict = 'escalate';
    signed.output.human_review_required = true;
    signed.output.human_review_reasons = [
      ...(signed.output.human_review_reasons ?? []),
      `recursion_rule_paths: ${protectedHint.matchedFiles.join(', ')}`,
    ];
  }

  // Always render a useful comment. The agent sometimes returns the
  // dimensions object without a comment_markdown; we render one from
  // the structured output so PRs never end up with `_(empty comment)_`.
  if (!signed.output.comment_markdown || signed.output.comment_markdown.trim() === '') {
    signed.output.comment_markdown = renderCommentFromOutput(signed.output);
  }

  fs.writeFileSync(outputPath, JSON.stringify(signed, null, 2));
  fs.writeFileSync(commentPath, signed.output.comment_markdown);
  fs.writeFileSync(verdictPath, signed.output.verdict ?? 'escalate');
}

main().catch((err) => {
  // Last-resort: write a fallback comment and verdict so the workflow can
  // proceed to post a "review failed; human review required" message.
  const fallbackComment = [
    ':warning: **PR review agent failed**',
    '',
    'The automated PR review could not complete. Falling back to human review.',
    '',
    `Error: \`${err.message}\``,
    '',
    'See workflow logs for details.',
  ].join('\n');
  try {
    fs.writeFileSync(
      process.env.OUTPUT_PATH ?? '/tmp/pr-review-output.json',
      JSON.stringify({ status: 'failed', error: err.message }, null, 2)
    );
    fs.writeFileSync(
      process.env.COMMENT_PATH ?? '/tmp/pr-review-comment.md',
      fallbackComment
    );
    fs.writeFileSync(process.env.VERDICT_PATH ?? '/tmp/pr-review-verdict', 'escalate');
  } catch (writeErr) {
    console.error('Failed to write fallback artifacts:', writeErr);
  }
  console.error(err);
  process.exit(1);
});
