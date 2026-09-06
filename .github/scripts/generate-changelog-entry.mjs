import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const CHANGELOG = "changelog.mdx";
const DEFAULT_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "z-ai/glm-5.2:free",
  "google/gemma-4-31b-it:free",
].join(",");
const SPEC_DIR = "api-collections/swagger";
const CHANGES_DIR = process.env.CHANGES_DIR || "changes";
const BASE_SPEC_DIR = process.env.BASE_SPEC_DIR || join(CHANGES_DIR, "base");
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODELS = (process.env.OPENROUTER_MODELS || DEFAULT_MODELS)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const MAX_PROMPT_CHARS = 16000;
const ATTEMPTS_PER_MODEL = Number(process.env.ATTEMPTS_PER_MODEL || 3);
const DRY_RUN = process.argv.includes("--dry-run");

if (!API_KEY) fail("OPENROUTER_API_KEY is not set");
if (MODELS.length === 0) fail("OPENROUTER_MODELS is empty");

const changes = loadChanges();
if (changes.length === 0) {
  console.log("no api changes found, nothing to do");
  process.exit(0);
}

const tags = deriveTags(changes);
const label = new Date().toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const changelog = readFileSync(CHANGELOG, "utf8");
const examples = existingEntries(changelog).slice(0, 2).join("\n\n");

const body = await generate(buildPrompt({ changes, tags, examples }));
const block = `<Update label="${label}" tags={${JSON.stringify(tags)}}>\n${indent(body)}\n</Update>`;

if (DRY_RUN) {
  console.log(block);
  process.exit(0);
}

writeFileSync(CHANGELOG, insertEntry(changelog, block));
console.log(`added a ${tags.join("/")} entry dated ${label} to ${CHANGELOG}`);

function loadChanges() {
  if (!existsSync(CHANGES_DIR)) return [];
  const out = [];
  for (const file of readdirSync(CHANGES_DIR).filter((f) => f.endsWith(".json"))) {
    const raw = readFileSync(join(CHANGES_DIR, file), "utf8").trim();
    if (!raw) continue;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) continue;
    const specName = basename(file, ".json");
    const head = readSpec(join(SPEC_DIR, specName));
    const base = readSpec(join(BASE_SPEC_DIR, specName));
    for (const change of list) {
      const removed = /removed/.test(change.id);
      out.push({
        spec: specName,
        id: change.id,
        text: change.text,
        level: change.level,
        operation: change.operation,
        path: change.path,
        definition: operationSummary(removed ? base : head, change.path, change.operation),
      });
    }
  }
  return out;
}

function readSpec(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function operationSummary(spec, path, method) {
  const op = spec?.paths?.[path]?.[String(method || "").toLowerCase()];
  if (!op) return null;
  const params = (op.parameters || []).map((p) => ({
    name: p.name,
    in: p.in,
    required: p.required || false,
    type: p.schema?.type,
  }));
  const bodySchema = op.requestBody?.content?.["application/json"]?.schema;
  return {
    summary: op.summary,
    description: op.description,
    tags: op.tags,
    parameters: params,
    requestBody: trimSchema(bodySchema, 2),
  };
}

function trimSchema(schema, depth) {
  if (!schema || depth === 0) return undefined;
  if (schema.$ref) return { ref: schema.$ref };
  const out = {};
  if (schema.type) out.type = schema.type;
  if (schema.required) out.required = schema.required;
  if (schema.enum) out.enum = schema.enum;
  if (schema.properties) {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties)
        .slice(0, 30)
        .map(([k, v]) => [k, trimSchema(v, depth - 1) || { type: v.type }])
    );
  }
  if (schema.items) out.items = trimSchema(schema.items, depth - 1);
  return out;
}

function deriveTags(list) {
  const tags = [];
  if (list.some((c) => c.level === 3)) tags.push("Breaking");
  if (list.some((c) => /added/.test(c.id) && /(endpoint|api-path)/.test(c.id))) tags.push("New");
  if (tags.length === 0) tags.push("Fix");
  return tags;
}

function existingEntries(text) {
  return [...text.matchAll(/<Update[^>]*>\n([\s\S]*?)\n<\/Update>/g)].map((m) =>
    m[1].replace(/^ {2}/gm, "")
  );
}

function buildPrompt({ changes, tags, examples }) {
  const lines = [];
  let used = 0;
  for (const c of changes) {
    const line = `- [${c.spec}] ${c.operation || ""} ${c.path || ""}: ${c.text} (level ${c.level})`;
    const detail = c.definition ? `\n  definition: ${JSON.stringify(c.definition)}` : "";
    const full = used + line.length + detail.length < MAX_PROMPT_CHARS ? line + detail : line;
    used += full.length;
    if (used > MAX_PROMPT_CHARS) {
      lines.push(`- ${changes.length - lines.length} further changes omitted for length`);
      break;
    }
    lines.push(full);
  }
  return `You write changelog entries for the Bitnob developer documentation. Bitnob is a financial infrastructure API for bitcoin, stablecoins, and local currency rails across Africa.

Write the body of one changelog entry describing the API changes below. The entry will be wrapped in a Mintlify <Update> component tagged ${JSON.stringify(tags)}, so do not output the wrapper, the date, or the tags.

Rules:
- Start with a level two markdown heading (##) that names the change in sentence case, for example "## Virtual Accounts API" or "## Legacy Virtual Cards endpoints removed".
- Then one or two short paragraphs written for an integrator, explaining what changed and what they need to do.
- Put endpoints in a markdown table with columns "Operation" and "Endpoint" when more than one endpoint is involved. Format endpoints as \`METHOD /path\` in backticks.
- Use a "Before" and "After" table for renamed or replaced things.
- Mention required fields and idempotency keys when the definition shows them.
- Plain declarative sentences. No marketing language, no exclamation marks, no em dashes.
- Use backticks for field names, endpoints, and event names.
- Lowercase "bitcoin" for the currency, "Bitcoin" for the network.
- Do not invent behaviour that is not in the change list or the definitions. Never state a status code, error message, or runtime behaviour unless it appears in a definition. Say an endpoint was removed, not what calling it now returns.
- Write plain ASCII. Use a normal hyphen and a straight apostrophe, never typographic dashes or curly quotes.
- Output markdown only. No code fences around the whole answer, no preamble, no closing remarks.

Two existing entries, for style:

${examples}

API changes detected by diffing the OpenAPI specs:

${lines.join("\n")}`;
}

async function generate(prompt) {
  const errors = [];
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const started = Date.now();
        const { text, served } = await callOpenRouter(model, prompt);
        const cleaned = cleanOutput(text);
        if (!cleaned.startsWith("## ")) throw new Error("output did not start with a heading");
        const invented = cleaned.match(/\b[45]\d\d\b/);
        if (invented) throw new Error(`mentions status code ${invented[0]}, which the diff does not state`);
        const via = served && served !== model ? `${model} via ${served}` : model;
        console.log(`generated with ${via} in ${Math.round((Date.now() - started) / 1000)}s`);
        return cleaned;
      } catch (err) {
        console.warn(`${model} attempt ${attempt}: ${err.message}`);
        errors.push(`${model} attempt ${attempt}: ${err.message}`);
        if (attempt < ATTEMPTS_PER_MODEL) await sleep(2000 * attempt);
      }
    }
  }
  fail(`every model failed:\n${errors.join("\n")}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenRouter(model, prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/bitnob/stealthdocs",
      "X-Title": "Bitnob docs changelog",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`http ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (!content || !content.trim()) throw new Error("empty completion");
  if (choice.finish_reason === "length") throw new Error("completion was cut off by the token limit");
  return { text: content, served: data.model };
}

function cleanOutput(text) {
  let out = text.trim();
  out = out.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fence = out.match(/^```[a-z]*\n([\s\S]*?)\n```$/);
  if (fence) out = fence[1].trim();
  out = out.replace(/<\/?Update[^>]*>/g, "").trim();
  out = normalizeAscii(out);
  return out;
}

function normalizeAscii(text) {
  return text
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/[\u2010\u2011\u2012\u2013]/g, "-")
    .replace(/[\u2018\u2019\u201b]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u00a0\u2007\u202f]/g, " ");
}

function indent(text) {
  return text
    .split("\n")
    .map((line) => (line.length ? `  ${line}` : line))
    .join("\n");
}

function insertEntry(text, block) {
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) fail(`could not find frontmatter in ${CHANGELOG}`);
  const head = text.slice(0, end + 5);
  const rest = text.slice(end + 5).replace(/^\s+/, "");
  return `${head}\n${block}\n\n${rest}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
