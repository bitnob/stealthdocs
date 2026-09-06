import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DOCS_CONFIG = "docs.json";
const SPEC_DIR = "api-collections/swagger";
const METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

const operations = loadOperations();
const listed = navigationOperations(JSON.parse(readFileSync(DOCS_CONFIG, "utf8")).navigation);

const orphaned = [...listed].filter((entry) => !operations.has(entry)).sort();
const unlisted = [...operations].filter((entry) => !listed.has(entry)).sort();

if (orphaned.length === 0 && unlisted.length === 0) {
  console.log("navigation matches the specs");
  process.exit(0);
}

const lines = ["## Navigation drift", ""];
if (orphaned.length) {
  lines.push("These navigation entries point at operations no spec defines. Remove them from `docs.json`.", "");
  lines.push(...orphaned.map((entry) => `- \`${entry}\``), "");
}
if (unlisted.length) {
  lines.push("These operations are in a spec but missing from the navigation, so their pages are unreachable. Add them to `docs.json`.", "");
  lines.push(...unlisted.map((entry) => `- \`${entry}\``), "");
}
console.log(lines.join("\n"));

function loadOperations() {
  const found = new Set();
  if (!existsSync(SPEC_DIR)) return found;
  for (const file of readdirSync(SPEC_DIR).filter((f) => f.endsWith(".openapi.json"))) {
    const spec = JSON.parse(readFileSync(join(SPEC_DIR, file), "utf8"));
    for (const [path, item] of Object.entries(spec.paths || {})) {
      for (const method of Object.keys(item)) {
        if (METHODS.includes(method)) found.add(`${method.toUpperCase()} ${path}`);
      }
    }
  }
  return found;
}

function navigationOperations(node, found = new Set()) {
  if (Array.isArray(node)) {
    for (const child of node) navigationOperations(child, found);
  } else if (node && typeof node === "object") {
    for (const child of Object.values(node)) navigationOperations(child, found);
  } else if (typeof node === "string") {
    const [method] = node.split(" ");
    if (METHODS.includes(method.toLowerCase()) && node.includes(" /")) found.add(node);
  }
  return found;
}
