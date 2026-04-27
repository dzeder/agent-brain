# Log-scrubbing pattern test cases

> Quarterly re-test obligation per `AGENT_PRODUCT_CYCLE.md` §04 Data &
> Privacy Security ("Log scrubbing regex patterns maintained and tested
> quarterly"). Each row below is a literal string that must match (or
> not match) the corresponding pattern in `patterns.yaml`. CI runs each
> regex against this file and fails if any expectation is violated.
>
> Format: `pattern_id | should_match (yes/no) | input string`

| pattern_id | should_match | input |
|-----------|--------------|-------|
| aws-access-key-id | yes | `AKIAIOSFODNN7EXAMPLE` |
| aws-access-key-id | no | `AKIA short` |
| aws-access-key-id | no | `not-an-akia-key-but-mentions-it` |
| aws-secret-access-key | yes | `AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"` |
| aws-secret-access-key | no | `# wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` (no labeled context) |
| github-token | yes | `ghp_abcdefghijklmnopqrstuvwxyz0123456789` |
| github-token | yes | `ghs_abcdefghijklmnopqrstuvwxyz0123456789` |
| github-token | no | `ghp_short` |
| anthropic-api-key | yes | `sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz` |
| anthropic-api-key | no | `sk-ant-` |
| openai-api-key | yes | `sk-AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGh` |
| openai-api-key | no | `sk-tooshort` |
| stripe-api-key | yes | `sk_live_4eC39HqLyjWDarjtT1zdp7dc` |
| stripe-api-key | yes | `sk_test_BQokikJOvBiI2HlWgH4olfQ2` |
| slack-token | yes | `xoxb-1234567890-abcdef-ghijkl` |
| slack-token | yes | `xoxp-12345-67890-abcde` |
| google-api-key | yes | `AIzaSyBmKQp7_Z7cYRA-X1234567890abcdefgh` |
| bearer-token | yes | `Authorization: Bearer abc.def.ghi-XYZ_123==` |
| bearer-token | yes | `authorization: bearer xyz` |
| jwt-token | yes | `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c` |
| postgres-uri | yes | `postgres://user:pass@db.internal:5432/prod` |
| postgres-uri | yes | `postgresql://app:hunter2@10.0.1.5/main` |
| mysql-uri | yes | `mysql://root:secret@127.0.0.1:3306/test` |
| mongodb-uri | yes | `mongodb+srv://app:p@ssw0rd@cluster0.example.net/db` |
| redis-uri | yes | `rediss://:authpass@cache.internal:6380` |
| labeled-secret-assignment | yes | `password="hunter2longenough"` |
| labeled-secret-assignment | yes | `api_key: 'abcdef0123456789'` |
| labeled-secret-assignment | no | `password tip: don't reuse` (no value) |
| credit-card-number | yes | `4111 1111 1111 1111` |
| credit-card-number | yes | `5500-0000-0000-0004` |
| credit-card-number | yes | `378282246310005` |
| ssn-us | yes | `123-45-6789` |
| ssn-us | no | `000-12-3456` |
| ssn-us | no | `666-12-3456` |
| ssn-us | no | `999-12-3456` |
| iban | yes | `DE89370400440532013000` |
| iban | yes | `GB82WEST12345698765432` |
| email-address | yes | `someone@example.com` |
| email-address | yes | `first.last+tag@sub.example.co.uk` |
| email-address | no | `not an email` |
| phone-us-international | yes | `+1 (415) 555-0100` |
| phone-us-international | yes | `415-555-0100` |
| phone-us-international | yes | `+44 20 7946 0958` |
| internal-hostname | yes | `db1.internal` |
| internal-hostname | yes | `app-prod.corp` |
| internal-hostname | no | `example.com` |
| private-ipv4 | yes | `10.0.0.1` |
| private-ipv4 | yes | `172.16.5.99` |
| private-ipv4 | yes | `192.168.1.1` |
| private-ipv4 | no | `8.8.8.8` |
| kubernetes-secret-yaml | yes | `  password: c3VwZXJzZWNyZXRwYXNz` |
| kubernetes-secret-yaml | yes | `  api_key: YWFhYWFhYWFhYWFhYWFhYQ==` |

## Quarterly re-test procedure

1. `cd security/log-scrubbing`
2. Run the patterns against every input row in this file (CI script
   forthcoming — placeholder is a manual run with `rg` per pattern).
3. Diff the result set against the `should_match` column.
4. Any false negative (should_match=yes but pattern missed) is a
   high-priority security fix.
5. Any false positive on a real production-trace sample is a
   medium-priority pattern-tuning fix.
6. Append the run date and outcome to `quarterly-run-log.md` (TODO
   create on first run).

## Adding a pattern

1. Add the pattern entry to `patterns.yaml` with id, description,
   pattern, severity, replacement, notes.
2. Add ≥ 2 should_match=yes test cases and ≥ 1 should_match=no test
   case to this file.
3. Re-run the quarterly check; commit the patterns + test cases together.
