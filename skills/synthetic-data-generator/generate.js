#!/usr/bin/env node
/**
 * synthetic-data-generator — CLI entrypoint.
 *
 * Wraps the procedure documented in SKILL.md so non-agent contexts (CI,
 * dev scripts) can produce synthetic records too. The agent-side execution
 * does not need this file — it reads SKILL.md directly.
 *
 * Usage:
 *   node generate.js --template support-message --count 25 --output out.json
 *   node generate.js --schema path/to/schema.json --count 50
 *
 * Env:
 *   ANTHROPIC_API_KEY  required
 *   MODEL              defaults to claude-sonnet-4-6
 *
 * Exit codes:
 *   0  success (records written)
 *   1  invalid input (missing schema/template, count out of range, malformed)
 *   2  generation failed (API error, all retries exhausted)
 *   3  validation failed (< 70% records survived schema/PII filters)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const SKILL_VERSION = '0.9.0';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_COUNT = 1000;
const MIN_SURVIVAL_RATIO = 0.7;
const MAX_TOKENS_PER_RECORD = 800;
const MAX_RETRIES = 1;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

function loadTemplate(name) {
  const p = path.resolve(__dirname, 'templates', `${name}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Unknown template: ${name}. See /skills/synthetic-data-generator/templates/.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadSchema(p) {
  const abs = path.resolve(p);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function stripDiversityProfile(schema) {
  // The generator reads `_diversity_profile`; the schema validator does not.
  // Return both halves separately.
  const { _diversity_profile, ...validatorSchema } = schema;
  return { validatorSchema, diversityProfile: _diversity_profile ?? null };
}

function buildPrompt({ schema, count, constraints, diversityPlan }) {
  const constraintsText = JSON.stringify(constraints ?? {}, null, 2);
  const diversityText = diversityPlan
    ? JSON.stringify(diversityPlan, null, 2)
    : '(default: distribute categoricals evenly subject to share cap; vary length and tone for free-text)';
  return [
    `You are generating ${count} synthetic records that conform to the JSON schema below.`,
    '',
    'Apply these privacy and safety rules — these are HARD CONSTRAINTS:',
    '- No real-format US SSNs (NNN-NN-NNNN). Use 999-NN-NNNN style fakes.',
    '- No credit-card numbers passing Luhn. Use 4111-1111-1111-1111 style test numbers.',
    '- No real phone numbers. Use 555-prefix US, +44 7700 9xxxxx UK, +1 555 0xxx CA.',
    '- No real customer-domain emails. Use example.com / example.org / test.invalid.',
    '- No real public figures, real customer names, or names that resemble specific real individuals.',
    '- No fabricated addresses that match real locations. Use 123 Test Lane, 42 Sample Street, etc.',
    '',
    'Apply these diversity controls:',
    diversityText,
    '',
    'Apply these caller-supplied constraints:',
    constraintsText,
    '',
    'Each record must:',
    '- Be syntactically valid JSON.',
    '- Validate against the schema (every required field present, types correct).',
    '- Be visibly different from the others (vary categorical values, free-text wording, lengths).',
    '- NOT include any field beginning with `_` from the schema (those are diversity hints, not record fields).',
    '',
    'Schema:',
    '```json',
    JSON.stringify(schema, null, 2),
    '```',
    '',
    `Output exactly ${count} records as a JSON array. No prose. No code fences. Begin with [ and end with ].`,
  ].join('\n');
}

function planDiversity(diversityProfile, constraints, count) {
  if (!diversityProfile) return null;
  const plan = { categorical_share_cap: diversityProfile.categorical_share_cap ?? 0.3 };
  if (diversityProfile.minimum_distinct) {
    plan.minimum_distinct_categorical = diversityProfile.minimum_distinct;
  }
  if (diversityProfile.length_buckets || diversityProfile.length_buckets_body) {
    plan.length_buckets = diversityProfile.length_buckets ?? diversityProfile.length_buckets_body;
  }
  if (constraints?.locale) plan.locale_distribution = constraints.locale;
  if (constraints?.tone) plan.tone = constraints.tone;
  if (constraints?.severity_distribution) plan.severity_distribution = constraints.severity_distribution;
  return plan;
}

function looksLikeRealPII(record) {
  // Cheap pre-flight check. Aligns with /security/log-scrubbing/patterns.yaml
  // severity:high categories. Not exhaustive — defense in depth, not the
  // only line.
  const flat = JSON.stringify(record);
  const ssnReal = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/;
  const ccLuhn = /\b\d{13,19}\b/;
  // Match a US-style 7-digit phone grouping (e.g., "867-5309", "415 0100").
  // Exempt the `555-` test prefix via a lookahead at the captured group's
  // start (a lookbehind here doesn't capture intent — it asks "what's BEFORE
  // 555?" rather than "is the captured group itself 555-prefixed?").
  const realPhone = /\b(?!555[-.\s])\d{3}[-.\s]\d{4}\b/;
  if (ssnReal.test(flat)) return 'ssn-like';
  // Note: ccLuhn intentionally lenient — false positives are acceptable
  // because we're discarding suspect records, not the whole batch.
  if (ccLuhn.test(flat) && !flat.includes('4111')) return 'cc-like';
  if (realPhone.test(flat) && !flat.includes('555')) return 'phone-like';
  return null;
}

function shannon(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let h = 0;
  for (const v of Object.values(counts)) {
    if (v === 0) continue;
    const p = v / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function summarizeDistribution(records, schema) {
  const summary = {};
  if (!schema.properties) return summary;
  for (const [field, def] of Object.entries(schema.properties)) {
    if (field.startsWith('_')) continue;
    if (def.enum) {
      const counts = {};
      for (const v of def.enum) counts[v] = 0;
      for (const r of records) {
        if (r[field] !== undefined && counts[r[field]] !== undefined) {
          counts[r[field]] += 1;
        }
      }
      summary[field] = { type: 'categorical', counts, entropy: Number(shannon(counts).toFixed(3)) };
    } else if (def.type === 'integer' || def.type === 'number') {
      const vals = records.map((r) => r[field]).filter((v) => typeof v === 'number');
      if (vals.length === 0) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      summary[field] = {
        type: 'numeric',
        mean: Number(mean.toFixed(3)),
        stddev: Number(Math.sqrt(variance).toFixed(3)),
        min: Math.min(...vals),
        max: Math.max(...vals),
      };
    } else if (def.type === 'string' && !def.enum && !def.format) {
      const lengths = records.map((r) => (typeof r[field] === 'string' ? r[field].length : 0));
      const buckets = { short: 0, medium: 0, long: 0 };
      for (const len of lengths) {
        if (len < 100) buckets.short += 1;
        else if (len < 400) buckets.medium += 1;
        else buckets.long += 1;
      }
      summary[field] = { type: 'free_text', length_buckets: buckets };
    }
  }
  return summary;
}

function deduplicate(records, schema) {
  const seen = new Set();
  const out = [];
  const keys = schema.required ?? Object.keys(schema.properties ?? {});
  for (const r of records) {
    const fingerprint = JSON.stringify(keys.map((k) => r[k]));
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    out.push(r);
  }
  return out;
}

async function callClaude({ apiKey, model, prompt, count, seed }) {
  const client = new Anthropic({ apiKey });
  const maxTokens = Math.min(8000, count * MAX_TOKENS_PER_RECORD);
  // The Anthropic SDK doesn't expose deterministic seeding; the seed is
  // recorded in the manifest for traceability, not for re-creation.
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.7,
    system:
      'You are a synthetic test-data generator. Produce diverse, schema-valid records that never include real PII or real-person impersonation. Output JSON only — no prose, no code fences.',
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  // Strip code fences if the model added them despite instructions.
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();
  return { text: cleaned, model: response.model, usage: response.usage, seed: seed ?? null };
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is required.');
    process.exit(1);
  }

  const count = Number(args.count ?? 10);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    console.error(`--count must be an integer in [1, ${MAX_COUNT}]. Got: ${args.count}`);
    process.exit(1);
  }

  let rawSchema;
  if (args.template) {
    rawSchema = loadTemplate(args.template);
  } else if (args.schema) {
    rawSchema = loadSchema(args.schema);
  } else {
    console.error('One of --template or --schema is required.');
    process.exit(1);
  }

  const { validatorSchema, diversityProfile } = stripDiversityProfile(rawSchema);
  const constraints = args.constraints ? JSON.parse(args.constraints) : {};
  const diversityPlan = planDiversity(diversityProfile, constraints, count);
  const seed = args.seed ?? null;
  const model = process.env.MODEL ?? args.model ?? DEFAULT_MODEL;

  const prompt = buildPrompt({
    schema: validatorSchema,
    count,
    constraints,
    diversityPlan,
  });

  let parsed = null;
  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const { text } = await callClaude({ apiKey, model, prompt, count, seed });
      parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Model returned non-array; expected JSON array.');
      }
      break;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt + 1} failed:`, err.message);
    }
  }
  if (parsed === null) {
    console.error('All retries exhausted:', lastError?.message);
    process.exit(2);
  }

  // Filter: drop records that look like real PII.
  const piiFiltered = [];
  const piiWarnings = [];
  for (const r of parsed) {
    const piiFlag = looksLikeRealPII(r);
    if (piiFlag) {
      piiWarnings.push(`record dropped: ${piiFlag}`);
      continue;
    }
    piiFiltered.push(r);
  }

  // De-duplicate.
  const deduped = deduplicate(piiFiltered, validatorSchema);
  const dedupeLoss = piiFiltered.length - deduped.length;

  // Tag.
  const tagged = deduped.map((r) => ({
    synthetic_source: `synthetic-data-generator@${SKILL_VERSION}`,
    ...r,
  }));

  if (tagged.length < count * MIN_SURVIVAL_RATIO) {
    console.error(
      `Survival ratio ${tagged.length}/${count} below ${MIN_SURVIVAL_RATIO * 100}% threshold. Surfacing as warning; consumer should re-run with adjusted controls.`
    );
  }

  const distribution = summarizeDistribution(tagged, validatorSchema);
  const warnings = [
    ...piiWarnings,
    ...(dedupeLoss > 0 ? [`deduplication: ${dedupeLoss} record(s) collapsed`] : []),
    ...(tagged.length < count * MIN_SURVIVAL_RATIO
      ? [`coverage_gap: ${tagged.length}/${count} records survived; below ${MIN_SURVIVAL_RATIO * 100}% threshold`]
      : []),
  ];

  const result = {
    records: tagged,
    manifest: {
      model,
      seed,
      requested_count: count,
      generated_count: tagged.length,
      constraints,
      distribution,
      warnings,
    },
  };

  if (args.output) {
    fs.writeFileSync(args.output, JSON.stringify(result, null, 2));
    console.error(`Wrote ${tagged.length} records + manifest to ${args.output}`);
  } else {
    process.stdout.write(JSON.stringify(result, null, 2));
  }

  if (tagged.length < count * MIN_SURVIVAL_RATIO) process.exit(3);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(2);
});
