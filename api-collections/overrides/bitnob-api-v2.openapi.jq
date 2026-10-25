# Local changes layered on the published v2 spec until engineering ships them.
# spec-sync applies this filter to every fetched copy, so keep it idempotent.
#
# The published spec has one apiKey scheme for X-Auth-Signature, which makes the
# playground ask for a signature. These two schemes ask for the client id and
# the sandbox secret instead, and test-playground.js signs the request with them.
# The secret header is removed in the browser and never sent.

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
