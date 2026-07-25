#!/usr/bin/env bash
# Seed the Meilisearch `demo` index used by the landing page search demo.
#
# Idempotent: creates the index if missing, replaces its settings, and
# upserts the 4 products in src/data/demo-products.json. The
# _data_quality_note field on each product is stripped before upload —
# it's a reading aid for humans, not data the index should know about.
#
# Usage:
#   MEILISEARCH_MASTER_KEY=<key> ./scripts/seed-meilisearch.sh
set -euo pipefail

MS_HOST="${MEILISEARCH_HOST:-https://ms-5a6fa3e472b4-47486.nyc.meilisearch.io}"
: "${MEILISEARCH_MASTER_KEY:?set MEILISEARCH_MASTER_KEY before running}"

INDEX=demo
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PRODUCTS="$SCRIPT_DIR/../src/data/demo-products.json"

call() {
  curl -sS -H "Authorization: Bearer $MEILISEARCH_MASTER_KEY" -H "Content-Type: application/json" "$@"
}

wait_task() {
  local uid="$1"
  for _ in $(seq 1 20); do
    local s
    s=$(call "$MS_HOST/tasks/$uid" | jq -r .status)
    if [ "$s" = "succeeded" ] || [ "$s" = "failed" ] || [ "$s" = "canceled" ]; then
      echo "task $uid → $s"
      [ "$s" = "succeeded" ] || exit 1
      return
    fi
    sleep 1
  done
  echo "task $uid did not finish in 20s" >&2
  exit 1
}

echo "==> ensuring index $INDEX exists"
created=$(call -X POST "$MS_HOST/indexes" --data "{\"uid\":\"$INDEX\",\"primaryKey\":\"id\"}" | jq -r .taskUid)
[ -n "$created" ] && [ "$created" != "null" ] && wait_task "$created" || true

echo "==> searchable attributes"
uid=$(call -X PUT "$MS_HOST/indexes/$INDEX/settings/searchable-attributes" \
  --data '["name","brand","category","description","attribute_tags"]' | jq -r .taskUid)
wait_task "$uid"

echo "==> filterable attributes"
uid=$(call -X PUT "$MS_HOST/indexes/$INDEX/settings/filterable-attributes" \
  --data '["attribute_tags","brand","category"]' | jq -r .taskUid)
wait_task "$uid"

echo "==> synonyms"
uid=$(call -X PUT "$MS_HOST/indexes/$INDEX/settings/synonyms" \
  --data '{"button down":["button-down"],"button-down":["button down"],"buttondown":["button-down"],"slim-fit":["slim fit"],"slimfit":["slim fit"]}' \
  | jq -r .taskUid)
wait_task "$uid"

echo "==> upsert products"
tmp=$(mktemp)
jq 'map(del(._data_quality_note))' "$PRODUCTS" > "$tmp"
uid=$(call -X POST "$MS_HOST/indexes/$INDEX/documents" --data-binary @"$tmp" | jq -r .taskUid)
rm -f "$tmp"
wait_task "$uid"

echo "==> done. document count:"
call "$MS_HOST/indexes/$INDEX/stats" | jq '{numberOfDocuments, fieldDistribution}'
