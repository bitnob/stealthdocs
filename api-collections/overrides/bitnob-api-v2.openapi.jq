# Local changes layered on the published v2 spec until engineering ships them.
# spec-sync applies this filter to every fetched copy, so keep it idempotent.
#
# The published spec has one apiKey scheme for X-Auth-Signature, which makes the
# playground ask for a signature. These two schemes ask for the client id and
# the sandbox secret instead, and test-playground.js signs the request with them.
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

.components.securitySchemes |= (del(.BitnobHmacAuth) + {
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
    ["get", "/api/bulk-transfers/schedules/{scheduleId}/executions"]
  ) as [$method, $path] (.; del(.paths[$path][$method]))
| .paths |= with_entries(select(.value | keys - ["parameters", "summary", "description", "servers"] | length > 0))
# Responses captured from the sandbox by capture-responses.mjs, passed in with
# --slurpfile responses. They fill only success responses the spec leaves empty.
| reduce (($ARGS.named.responses[0] // {}) | to_entries[]) as $captured (.;
    ($captured.key | split(" ")) as [$method, $path]
    | ($method | ascii_downcase) as $method
    | ($captured.value.status | tostring) as $status
    | if .paths[$path][$method] == null then .
      elif [.paths[$path][$method].responses | to_entries[] | select(.key | startswith("2")) | .value.content] | any(. != null) then .
      else .paths[$path][$method].responses[$status] |=
        (. // {"description": "Successful response"}) + {"content": {"application/json": {"example": $captured.value.body}}}
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
