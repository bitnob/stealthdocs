// Captures real sandbox responses for v2 endpoints whose spec has none, and
// saves them to bitnob-api-v2.responses.json. The override turns each saved
// response into an example and a schema; a response in the spec always wins.
//
// Usage: node api-collections/overrides/capture-responses.mjs [options]
//   --param name=value   value for a path parameter, e.g. --param pair=BTCUSD
//   --allow "POST /path" also call this non-GET endpoint, with the request
//                        example from the spec as its body (repeatable)
//   --dry-run            list what would be called without calling it
//
// Only GET endpoints run by default, since other calls create or change things
// in the sandbox. Credentials come from .env.sandbox at the repo root:
//   BITNOB_CLIENT_ID=...
//   BITNOB_CLIENT_SECRET=...                 (or BITNOB_SANDBOX_CLIENT_SECRET)
//   BITNOB_BASE_URL=https://api.bitnob.com   (optional)
//
// Saved responses are published in the docs, so review the file before
// committing it.

import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const specPath = join(root, "api-collections/swagger/bitnob-api-v2.openapi.json");
const outPath = join(here, "bitnob-api-v2.responses.json");

function parseArgs(argv) {
  const args = { params: {}, allow: new Set(), dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--param") {
      const [name, ...value] = argv[++i].split("=");
      args.params[name] = value.join("=");
    } else if (argv[i] === "--allow") {
      args.allow.add(argv[++i]);
    } else if (argv[i] === "--dry-run") {
      args.dryRun = true;
    } else {
      throw new Error(`unknown option ${argv[i]}`);
    }
  }
  return args;
}

function loadEnv() {
  const envPath = join(root, ".env.sandbox");
  if (!existsSync(envPath)) throw new Error(".env.sandbox not found at the repo root");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  env.BITNOB_CLIENT_SECRET ??= env.BITNOB_SANDBOX_CLIENT_SECRET;
  if (!env.BITNOB_CLIENT_ID || !env.BITNOB_CLIENT_SECRET) {
    throw new Error(".env.sandbox needs BITNOB_CLIENT_ID and BITNOB_CLIENT_SECRET");
  }
  return env;
}

// Operations whose success responses carry no content.
function missingOperations(spec) {
  const ops = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(item)) {
      if (typeof op !== "object" || !op.responses) continue;
      const success = Object.entries(op.responses).filter(([code]) => code.startsWith("2"));
      if (success.length && success.every(([, response]) => !response.content)) {
        ops.push({ key: `${method.toUpperCase()} ${path}`, method: method.toUpperCase(), path, op });
      }
    }
  }
  return ops;
}

function requestExample(op) {
  const content = op.requestBody?.content?.["application/json"];
  if (!content) return undefined;
  if (content.example !== undefined) return content.example;
  if (content.schema?.example !== undefined) return content.schema.example;
  const named = Object.values(content.examples ?? {})[0];
  return named?.value;
}

async function call(env, method, path, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", env.BITNOB_CLIENT_SECRET)
    .update(`${env.BITNOB_CLIENT_ID}:${timestamp}:${nonce}:${payload}`)
    .digest("hex");

  const response = await fetch(`${env.BITNOB_BASE_URL ?? "https://api.bitnob.com"}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Client": env.BITNOB_CLIENT_ID,
      "X-Auth-Timestamp": timestamp,
      "X-Auth-Nonce": nonce,
      "X-Auth-Signature": signature,
    },
    body: payload || undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, json, text };
}

// First value of `name` (or `id`) on an object inside the response, used to
// fill a path parameter from the endpoint's parent list.
function findId(value, name) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findId(item, name);
      if (found !== undefined) return found;
    }
  } else if (value && typeof value === "object") {
    for (const key of [name, "id"]) {
      if (typeof value[key] === "string" || typeof value[key] === "number") return String(value[key]);
    }
    for (const child of Object.values(value)) {
      const found = findId(child, name);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

async function resolvePath(env, path, params) {
  let resolved = path;
  for (const [, name] of path.matchAll(/\{([^}]+)\}/g)) {
    let value = params[name];
    if (value === undefined) {
      const parent = path.slice(0, path.indexOf(`{${name}}`)).replace(/\/$/, "");
      if (!parent.includes("{")) {
        const list = await call(env, "GET", parent);
        if (list.status < 300) value = findId(list.json?.data ?? list.json, name);
      }
    }
    if (value === undefined) return { missing: name };
    resolved = resolved.replace(`{${name}}`, encodeURIComponent(value));
  }
  return { resolved };
}

const args = parseArgs(process.argv.slice(2));
const env = args.dryRun ? null : loadEnv();
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const saved = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};

for (const { key, method, path, op } of missingOperations(spec)) {
  if (method !== "GET" && !args.allow.has(key)) {
    console.log(`skip   ${key}  (not a GET; pass --allow "${key}" to call it)`);
    continue;
  }
  if (args.dryRun) {
    console.log(`would  ${key}`);
    continue;
  }

  const { resolved, missing } = await resolvePath(env, path, args.params);
  if (missing) {
    console.log(`skip   ${key}  (no value for {${missing}}; pass --param ${missing}=...)`);
    continue;
  }

  const result = await call(env, method, resolved, method === "GET" ? undefined : requestExample(op));
  if (result.status >= 300 || result.json === undefined) {
    console.log(`fail   ${key}  ${result.status} ${result.text.slice(0, 200)}`);
    continue;
  }
  saved[key] = { status: result.status, body: result.json };
  console.log(`saved  ${key}  ${result.status}`);
}

if (!args.dryRun) {
  writeFileSync(outPath, `${JSON.stringify(saved, null, 2)}\n`);
  console.log(`\nwrote ${Object.keys(saved).length} responses to ${outPath}`);
}
