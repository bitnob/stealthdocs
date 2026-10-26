// Signs API playground requests with Bitnob HMAC auth.
//
// The v2 spec asks for the client id (X-Auth-Client) and the sandbox secret
// (X-Playground-Client-Secret), see api-collections/overrides. This script reads
// both from the outgoing request, adds the timestamp, nonce and signature
// headers, and removes the secret so it never leaves the browser. Requests
// without both headers, such as the platform API, go out unchanged.

const CLIENT_ID_HEADER = "X-Auth-Client";
const CLIENT_SECRET_HEADER = "X-Playground-Client-Secret";

async function hmacSha256Hex(secret, message) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Removes a header whatever its casing and returns its value.
function takeHeader(headers, name) {
  const key = Object.keys(headers).find(
    (header) => header.toLowerCase() === name.toLowerCase(),
  );
  if (key === undefined) return undefined;

  const value = headers[key];
  delete headers[key];
  return typeof value === "string" ? value.trim() : value;
}

// Signs the playground request in place. The secret header is always removed,
// even when the request cannot be signed.
async function signRequest(parsed) {
  const headers = parsed.header || {};
  parsed.header = headers;
  const clientSecret = takeHeader(headers, CLIENT_SECRET_HEADER);
  const clientId = takeHeader(headers, CLIENT_ID_HEADER);

  if (!clientId || !clientSecret) {
    if (clientId) {
      headers[CLIENT_ID_HEADER] = clientId;
    }
    if (clientId || clientSecret) {
      console.warn(
        `Playground request not signed: enter both ${CLIENT_ID_HEADER} and ${CLIENT_SECRET_HEADER}.`,
      );
    }
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // GET requests such as /whoami have no body, so the payload is empty
  const payload =
    typeof parsed.body === "string"
      ? parsed.body
      : parsed.body
        ? JSON.stringify(parsed.body)
        : "";

  const signature = await hmacSha256Hex(
    clientSecret,
    `${clientId}:${timestamp}:${nonce}:${payload}`,
  );

  headers[CLIENT_ID_HEADER] = clientId;
  headers["X-Auth-Timestamp"] = timestamp;
  headers["X-Auth-Nonce"] = nonce;
  headers["X-Auth-Signature"] = signature;
}

(() => {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__interceptedUrl = url;

    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (
      typeof this.__interceptedUrl !== "string" ||
      !this.__interceptedUrl.includes("/_mintlify/api/request")
    ) {
      return originalSend.call(this, body);
    }

    const xhr = this;

    (async () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return originalSend.call(xhr, body);
      }

      try {
        await signRequest(parsed);
      } catch (error) {
        console.error("Playground request could not be signed:", error);
      }

      originalSend.call(xhr, JSON.stringify(parsed));
    })();
  };
})();
