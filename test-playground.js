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

(() => {
  console.log("Mintlify interceptor loaded");

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__interceptedUrl = url;
    this.__interceptedMethod = method;

    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (
      typeof this.__interceptedUrl === "string" &&
      this.__interceptedUrl.includes("/_mintlify/api/request")
    ) {
      const xhr = this;

      (async () => {
        const parsed = JSON.parse(body);

        const clientId = "9213f0c7-486f-4c8a-9c57-ab3fe68ee696";
        const clientSecret =
          "REDACTED";

        const timestamp = Math.floor(Date.now() / 1000).toString();

        const nonceBytes = crypto.getRandomValues(new Uint8Array(16));

        const nonce = Array.from(nonceBytes)
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");

        // /whoami is a GET request with no request body
        const payload =
          typeof parsed.body === "string"
            ? parsed.body
            : parsed.body
              ? JSON.stringify(parsed.body)
              : "";;

        const message = `${clientId}:${timestamp}:${nonce}:${payload}`;

        const signature = await hmacSha256Hex(clientSecret, message);

        parsed.header = parsed.header || {};

        parsed.header["X-Auth-Client"] = clientId;

        parsed.header["X-Auth-Timestamp"] = timestamp;

        parsed.header["X-Auth-Nonce"] = nonce;

        parsed.header["X-Auth-Signature"] = signature;

        console.log("HMAC message:", message);

        console.log("Generated signature:", signature);

        console.log("Signed request:", parsed);

        console.log("BODY VALUE:", parsed.body);
        console.log("BODY TYPE:", typeof parsed.body);
        console.log("BODY JSON:", JSON.stringify(parsed.body));

        console.log("PAYLOAD BEING SIGNED:", payload);
        console.log(
          "HMAC INPUT:",
          `${clientId}:${timestamp}:${nonce}:${payload}`,
        );

        const modifiedBody = JSON.stringify(parsed);

        originalSend.call(xhr, modifiedBody);
      })();

      return;
    }

    return originalSend.call(this, body);
  };
})();
