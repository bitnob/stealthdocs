# Local changes layered on the published v2 spec until engineering ships them.
# spec-sync applies this filter to every fetched copy, so keep it idempotent.
#
# The published spec has apiKey schemes for X-Auth-Signature and X-Auth-Secret,
# which make the playground ask for a signature or a raw secret. These two
# schemes ask for the client id and the sandbox secret instead, and test-playground.js signs the request with them.
# The secret header is removed in the browser and never sent.
#
# Most responses in the published spec carry an example but no schema, so the
# docs show the example and an empty field list. infer_schema builds a schema
# from the example wherever one is missing; a schema from the spec always wins.

def infer_schema:
  if type == "object" then
    {"type": "object", "properties": map_values(infer_schema)}
  elif type == "array" then
    {"type": "array", "items": (
      if length == 0 then {}
      # Merge every item so keys that only some items carry are still listed.
      elif all(.[]; type == "object") then reduce .[] as $item ({}; . * $item) | infer_schema
      else .[0] | infer_schema
      end
    )}
  elif type == "string" then
    {"type": "string"}
    + if test("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$") then {"format": "uuid"}
      elif test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T") then {"format": "date-time"}
      else {}
      end
  elif type == "number" then {"type": "number"}
  elif type == "boolean" then {"type": "boolean"}
  else {"nullable": true}
  end;

.components.securitySchemes |= (del(.BitnobHmacAuth, .hmac, .secret) + {
  "BitnobClientId": {
    "type": "apiKey",
    "in": "header",
    "name": "X-Auth-Client",
    "description": "Your workspace client id.\n\nAll calls must include four headers:\n- `X-Auth-Client`   — your workspace client id\n- `X-Auth-Timestamp` — Unix seconds\n- `X-Auth-Nonce`    — 16-byte random hex\n- `X-Auth-Signature` — hex(HMAC-SHA256(\n  `{client_id}:{timestamp}:{nonce}:{compact_json_body}`,\n  client_secret))\n\nThe playground computes the timestamp, nonce and signature for you.\n"
  },
  "BitnobClientSecret": {
    "type": "apiKey",
    "in": "header",
    "name": "X-Playground-Client-Secret",
    "description": "Your sandbox client secret. The playground uses it to sign the request in your browser and removes it before the request is sent. Never send your client secret as a header in your own integration.\n"
  }
})
| .security = [{"BitnobClientId": [], "BitnobClientSecret": []}]
# Operations the published spec lists but the API does not serve: every call
# returns "Cannot <METHOD> <path>" (checked against the sandbox on 2026-10-25).
# Drop an entry here once its route is live, and add it back to docs.json.
| reduce (
    ["get", "/api/trading/prices/{pair}"],
    ["post", "/api/trading/scheduled-orders"],
    ["get", "/api/trading/scheduled-orders"],
    ["get", "/api/trading/scheduled-orders/{id}"],
    ["put", "/api/trading/scheduled-orders/{id}"],
    ["get", "/api/trading/scheduled-orders/{id}/executions"],
    ["post", "/api/trading/target-orders"],
    ["get", "/api/trading/target-orders"],
    ["get", "/api/trading/target-orders/{id}"],
    ["post", "/api/bulk-transfers/schedules"],
    ["get", "/api/bulk-transfers/schedules"],
    ["put", "/api/bulk-transfers/schedules/{scheduleId}"],
    ["get", "/api/bulk-transfers/schedules/{scheduleId}/executions"],
    ["post", "/api/bulk-transfers"],
    ["get", "/api/bulk-transfers"],
    ["post", "/api/bulk-transfers/upload-urls"],
    ["post", "/api/bulk-transfers/previews"],
    ["get", "/api/bulk-transfers/{batchId}"],
    ["post", "/api/bulk-transfers/{batchId}/confirm"],
    ["post", "/api/bulk-transfers/{batchId}/retry"],
    ["post", "/api/bulk-transfers/executions/{executionId}/retry"]
  ) as [$method, $path] (.; del(.paths[$path][$method]))
| .paths |= with_entries(select(.value | keys - ["parameters", "summary", "description", "servers"] | length > 0))
# Drop tags that no remaining operation uses, such as Bulk transfers.
| ([.paths[][] | objects | .tags[]?] | unique) as $used
| if .tags then .tags |= map(select(.name as $name | $used | index($name))) else . end
# Responses captured from the sandbox by capture-responses.mjs, passed in with
# --slurpfile responses. They fill only success responses the spec leaves empty.
| reduce (($ARGS.named.responses[0] // {}) | to_entries[]) as $captured (.;
    ($captured.key | split(" ")) as [$method, $path]
    | ($method | ascii_downcase) as $method
    | ($captured.value.status | tostring) as $status
    | if .paths[$path][$method] == null then .
      elif [.paths[$path][$method].responses | to_entries[] | select(.key | startswith("2")) | .value.content] | any(. != null) then .
      # Replace the empty success responses, since the API may answer with a
      # different code than the spec lists (201 instead of 200).
      else .paths[$path][$method].responses |= (
        ([to_entries[] | select(.key | startswith("2")) | .value.description] | first // "Successful response") as $description
        | with_entries(select(.key | startswith("2") | not))
        | .[$status] = {"description": $description, "content": {"application/json": {"example": $captured.value.body}}}
      )
      end
  )
# Some operations list both 200 and 201 but only describe one; drop the empty
# success code so the docs do not show a blank response next to the real one.
| (.paths[][] | objects | select(.responses) | .responses) |= (
    if [to_entries[] | select(.key | startswith("2")) | .value.content] | any(. != null)
    then with_entries(select((.key | startswith("2") | not) or .value.content != null))
    else .
    end
  )
| (.paths[][] | objects | .responses[]? | .content[]? | select((has("example") or has("examples")) and (has("schema") | not)))
  |= . + {"schema": (
    if has("example") then .example
    # Named examples: merge them all so the schema lists every field they show.
    else [.examples[].value] | if all(.[]; type == "object") then reduce .[] as $value ({}; . * $value) else .[0] end
    end
    | infer_schema
  )}

# Endpoint pages take their URL from the tag and summary, and the staging spec
# retitled most of them. href pins every page that existed before it to its old
# URL, so links from the guides and search results keep working. New endpoints
# take the URL Mintlify derives from their summary. The supported chains URL
# moves to GET /api/addresses/supported-chains, which replaces the deprecated
# stablecoins route it used to show.
| {
    "GET /api/whoami":                                      "/api-reference/identity/who-am-i",
    "GET /api/balances":                                    "/api-reference/balances/list-balances",
    "GET /api/balances/{currency}":                         "/api-reference/balances/get-balance-by-currency",
    "POST /api/addresses":                                  "/api-reference/addresses/generate-address",
    "GET /api/addresses":                                   "/api-reference/addresses/list-addresses",
    "GET /api/addresses/{id}":                              "/api-reference/addresses/get-address-by-id",
    "POST /api/addresses/validate":                         "/api-reference/addresses/validate-address",
    "GET /api/addresses/supported-chains":                  "/api-reference/addresses/supported-chains",
    "POST /api/withdrawals":                                "/api-reference/withdrawals/initiate-withdrawal",
    "GET /api/transactions":                                "/api-reference/transactions/list-transactions",
    "GET /api/transactions/{id}":                           "/api-reference/transactions/get-transaction-by-id",
    "GET /api/exchange-rates":                              "/api-reference/exchange-rates/get-single-pair-rate",
    "GET /api/exchange-rates/convert":                      "/api-reference/exchange-rates/convert-amount",
    "GET /api/trading/prices":                              "/api-reference/trading/list-all-prices",
    "POST /api/trading/quotes":                             "/api-reference/trading/create-quote",
    "GET /api/trading/quotes/{id}":                         "/api-reference/trading/get-quote-status",
    "POST /api/trading/orders":                             "/api-reference/trading/submit-order",
    "GET /api/trading/orders":                              "/api-reference/trading/list-orders",
    "GET /api/trading/orders/{id}":                         "/api-reference/trading/get-order-by-id-or-reference",
    "DELETE /api/trading/orders/{id}":                      "/api-reference/trading/cancel-order",
    "POST /api/virtual-accounts":                           "/api-reference/virtual-accounts/create-virtual-account",
    "GET /api/virtual-accounts":                            "/api-reference/virtual-accounts/list-virtual-accounts",
    "GET /api/virtual-accounts/supported-currencies":       "/api-reference/virtual-accounts/supported-currencies",
    "GET /api/virtual-accounts/{id}":                       "/api-reference/virtual-accounts/get-virtual-account",
    "GET /api/virtual-accounts/{id}/transactions":          "/api-reference/virtual-accounts/get-account-transactions",
    "PATCH /api/virtual-accounts/{id}/alias":               "/api-reference/virtual-accounts/update-account-alias",
    "POST /api/virtual-accounts/{id}/simulate-deposit":     "/api-reference/virtual-accounts/simulate-deposit-sandbox",
    "POST /api/cards":                                      "/api-reference/cards/create-card",
    "GET /api/cards":                                       "/api-reference/cards/list-cards",
    "POST /api/cards/kyc":                                  "/api-reference/cards/card-kyc",
    "POST /api/cards/lite":                                 "/api-reference/cards/create-lite-card",
    "GET /api/cards/transactions":                          "/api-reference/cards/list-all-card-transactions",
    "GET /api/cards/{cardId}":                              "/api-reference/cards/get-card",
    "DELETE /api/cards/{cardId}":                           "/api-reference/cards/terminate-card",
    "GET /api/cards/{cardId}/secure":                       "/api-reference/cards/get-secure-card-details",
    "GET /api/cards/{cardId}/transactions":                 "/api-reference/cards/list-card-transactions-by-card",
    "GET /api/cards/{cardId}/transactions/{transactionId}": "/api-reference/cards/get-single-card-transaction",
    "POST /api/cards/{cardId}/balance":                     "/api-reference/cards/fund-or-withdraw-balance",
    "POST /api/cards/{cardId}/status":                      "/api-reference/cards/freeze-or-unfreeze",
    "PUT /api/cards/{cardId}/spend-limits":                 "/api-reference/cards/update-spend-limits",
    "PATCH /api/cards/{cardId}/contact":                    "/api-reference/cards/update-card-contact",
    "POST /api/cards/{cardId}/simulate-webhook":            "/api-reference/cards/simulate-card-webhook-sandbox",
    "POST /api/lightning/invoices":                         "/api-reference/lightning/create-invoice",
    "GET /api/lightning/invoices":                          "/api-reference/lightning/list-invoices",
    "GET /api/lightning/invoices/{id}":                     "/api-reference/lightning/get-invoice",
    "POST /api/lightning/decode":                           "/api-reference/lightning/decode-bolt11",
    "POST /api/lightning/preview":                          "/api-reference/lightning/preview-payment",
    "POST /api/lightning/pay":                              "/api-reference/lightning/send-payment",
    "GET /api/customers/{customerId}/cards":                "/api-reference/cards/get-cards-by-customer",
    "GET /api/customers/countries":                         "/api-reference/customers/list-countries",
    "GET /api/customers/countries/{countryCode}/states":    "/api-reference/customers/list-states-for-country",
    "POST /api/customers":                                  "/api-reference/customers/create-customer",
    "GET /api/customers":                                   "/api-reference/customers/list-customers",
    "GET /api/customers/{customerId}":                      "/api-reference/customers/get-customer",
    "PUT /api/customers/{customerId}":                      "/api-reference/customers/update-customer",
    "POST /api/beneficiaries":                              "/api-reference/beneficiaries/create-beneficiary",
    "GET /api/beneficiaries":                               "/api-reference/beneficiaries/list-beneficiaries",
    "GET /api/beneficiaries/{beneficiaryId}":               "/api-reference/beneficiaries/get-beneficiary",
    "PUT /api/beneficiaries/{beneficiaryId}":               "/api-reference/beneficiaries/update-beneficiary",
    "POST /api/payouts/quotes":                             "/api-reference/payouts/create-quote",
    "POST /api/payouts/{quoteId}/initialize":               "/api-reference/payouts/initialize-payout",
    "POST /api/payouts/{quoteId}/finalize":                 "/api-reference/payouts/finalize-payout",
    "GET /api/payouts/account-lookup":                      "/api-reference/payouts/account-lookup",
    "GET /api/payouts/supported-countries":                 "/api-reference/payouts/supported-countries",
    "GET /api/payouts/supported-countries/{country}":       "/api-reference/payouts/country-requirements",
    "GET /api/payouts/limits":                              "/api-reference/payouts/payout-limits",
    "GET /api/payouts/banks/{countryCode}":                 "/api-reference/payouts/banks-by-country",
    "GET /api/payouts":                                     "/api-reference/payouts/list-payouts",
    "GET /api/payouts/{id}":                                "/api-reference/payouts/get-payout"
  } as $hrefs
| reduce ($hrefs | to_entries[]) as $entry (.;
    ($entry.key | split(" ")) as [$method, $path]
    | ($method | ascii_downcase) as $method
    | if .paths[$path][$method] == null then .
      else .paths[$path][$method]["x-mint"] |= ((. // {}) * {"href": $entry.value})
      end
  )
