#!/usr/bin/env bash
# Coverage check encoding the verification appendix from
# /audits/2026-Q2/coverage-audit.md §6. Run from repo root.
#
# Exit code: 0 if all S1 baselines hold; non-zero if any drift detected.
# Output: one line per finding (silent on success).
#
# Usage:
#   ./scripts/audit-coverage.sh
#   ./scripts/audit-coverage.sh --verbose   # also prints OK lines

set -u
fail=0
verbose=0
[ "${1:-}" = "--verbose" ] && verbose=1

ok()   { [ "$verbose" -eq 1 ] && echo "OK    $1"; }
miss() { echo "MISS  $1"; fail=1; }

# 1. Top-level dirs (manual §3 Repo Architecture)
for d in agents registry schemas skills evals security standards docs prompts coaching audits context; do
  if [ -d "$d" ]; then ok "dir $d"; else miss "dir $d"; fi
done

# 2. Canonical schemas (manual §Inter-Agent Communication)
for f in schemas/agents/message-envelope/v1.0.0.json \
         schemas/agents/health-report/v1.0.0.json \
         schemas/workers/signed-output/v1.0.0.json \
         schemas/workers/reflection/v1.0.0.json \
         schemas/registry/decision/v1.0.0.json; do
  if [ -f "$f" ]; then ok "schema $f"; else miss "schema $f"; fi
done

# 3. Golden eval datasets >= 50 cases (manual line 1863)
for a in base-worker base-manager ceo; do
  if [ -f "evals/$a/tests.yaml" ]; then
    n=$(grep -c "^- description:" "evals/$a/tests.yaml" || true)
    if [ "$n" -ge 50 ]; then ok "evals/$a/tests.yaml ($n cases)"; else miss "evals/$a/tests.yaml ($n cases, need >=50)"; fi
  else
    miss "evals/$a/tests.yaml"
  fi
done

# 4. Registry agents have required fields (manual §11 Onboarding)
if command -v jq >/dev/null 2>&1; then
  bad=$(jq -r '.agents[] | select((has("layer") and has("owner") and has("scope") and has("model")) | not) | .agent_id' registry/agents.json 2>/dev/null || echo "PARSE_ERROR")
  if [ -z "$bad" ]; then ok "registry/agents.json required fields"; else miss "registry/agents.json missing fields on: $bad"; fi
else
  miss "jq not installed — cannot validate registry/agents.json"
fi

# 5. Coaching scaffolds for agents that declare a coaching_history
if command -v jq >/dev/null 2>&1; then
  jq -r '.agents[] | select(.coaching_history != null) | .coaching_history' registry/agents.json 2>/dev/null | \
    while read -r p; do
      [ -z "$p" ] && continue
      rel=".${p}"
      if [ -f "$rel" ]; then ok "coaching $rel"; else miss "coaching $rel"; fi
    done
fi

# 6. Required env vars in .env.example (per CLAUDE.md)
for v in MODEL_CEO MODEL_MANAGER MODEL_WORKER_COMPLEX MODEL_WORKER_SIMPLE MODEL_EVAL \
         HUMAN_PRINCIPAL_PRIMARY HUMAN_PRINCIPAL_BACKUP HUMAN_PRINCIPAL_TIMEZONE \
         HUMAN_PRINCIPAL_SLACK_ID MANAGED_AGENTS_BETA_HEADER; do
  if grep -q "^$v=" .env.example; then ok "env $v"; else miss "env $v"; fi
done

# 7. PR Anti-Drift template + CODEOWNERS + dependabot
for f in .github/PULL_REQUEST_TEMPLATE.md .github/CODEOWNERS .github/dependabot.yml \
         .github/workflows/eval-gate.yml .github/workflows/pr-review.yml \
         .github/workflows/linear-link-check.yml; do
  if [ -f "$f" ]; then ok "ci $f"; else miss "ci $f"; fi
done

# 8. Standards (manual §14)
for f in standards/security.md standards/prompt-engineering.md standards/model-selection.md \
         standards/inter-agent-comms.md standards/trust-levels.md; do
  if [ -f "$f" ]; then ok "standard $f"; else miss "standard $f"; fi
done

# 9. External-systems index
if [ -f docs/external-systems.md ]; then ok "docs/external-systems.md"; else miss "docs/external-systems.md"; fi

# 10. No co-located skills registry duplicate (S2-9)
if [ -f skills/registry.json ]; then miss "skills/registry.json should not exist (canonical is /registry/skills.json)"; else ok "no skills/registry.json duplicate"; fi

if [ "$fail" -eq 0 ]; then
  [ "$verbose" -eq 1 ] && echo "" && echo "All S1 baselines hold."
  exit 0
else
  echo ""
  echo "Coverage drift detected. See /audits/2026-Q2/coverage-audit.md for context."
  exit 1
fi
