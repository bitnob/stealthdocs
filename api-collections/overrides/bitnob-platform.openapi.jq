# Local changes layered on the published platform spec. spec-sync applies this
# filter to every fetched copy, so keep it idempotent.
#
# Endpoint pages take their title from the summary, and these share one with
# another endpoint. x-mint gives each a distinct page title; href keeps the
# existing URL.
{
  "POST /subscriptions/{id}/rotate-secret": {"title": "Rotate subscription signing secret", "href": "/api-reference/platform/subscriptions/rotate-signing-secret"},
  "POST /webhooks/{id}/rotate-secret": {"title": "Rotate webhook signing secret", "href": "/api-reference/platform/webhooks/rotate-signing-secret"},
  "GET /wallets/{id}/addresses": {"title": "List wallet addresses", "href": "/api-reference/platform/wallets/list-addresses"},
  "GET /transactions": {"title": "List transactions across wallets", "href": "/api-reference/platform/transactions/list-transactions"}
} as $titles
| reduce ($titles | to_entries[]) as $entry (.;
    ($entry.key | split(" ")) as [$method, $path]
    | ($method | ascii_downcase) as $method
    | if .paths[$path][$method] == null then .
      else .paths[$path][$method]["x-mint"] |= ((. // {}) * {"metadata": {"title": $entry.value.title}, "href": $entry.value.href})
      end
  )
