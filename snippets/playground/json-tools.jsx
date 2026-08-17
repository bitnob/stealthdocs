export const JsonFormatter = () => {
  const S = {
    shell: "not-prose pg-shell",
    header: "pg-header",
    title: "pg-title",
    subtitle: "pg-subtitle",
    body: "pg-body",
    label: "pg-label",
    input: "pg-input",
    select: "pg-select",
    textarea: "pg-textarea",
    row: "pg-row",
    grid: "pg-grid",
    grid2: "pg-grid2",
    grid3: "pg-grid3",
    btnPrimary: "pg-btn-primary",
    btnSecondary: "pg-btn-secondary",
    error: "pg-note pg-error",
    ok: "pg-note pg-ok",
    warn: "pg-note pg-warn",
    meta: "pg-meta",
    check: "pg-check",
    resultRow: "pg-result-row",
    resultKey: "pg-result-key",
    resultVal: "pg-result-val",
  };
  const SUBTITLE = "Runs locally in your browser. Nothing you type leaves this page.";
  const locateJsonError = (text, message) => {
    const match = /position (\d+)/i.exec(message || "");
    if (!match) return null;
    const pos = Math.min(Number(match[1]), Math.max(text.length - 1, 0));
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const column = pos - before.lastIndexOf("\n");
    return { pos, line, column, snippet: text.split("\n")[line - 1] || "" };
  };
  const formatBytes = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(2)} KB`);
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const sortValue = (value) => {
    if (Array.isArray(value)) return value.map(sortValue);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  };

  const format = () => {
    setCopied(false);
    if (!input.trim()) {
      setError("Enter some JSON first.");
      setOutput("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const spacer = indent === "tab" ? "\t" : Number(indent);
      setOutput(JSON.stringify(sortKeys ? sortValue(parsed) : parsed, null, spacer));
      setError("");
    } catch (e) {
      const where = locateJsonError(input, e.message);
      setError(where ? `${e.message} (line ${where.line}, column ${where.column})` : e.message);
      setOutput("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>JSON formatter</div>
        <div className={S.subtitle}>{SUBTITLE}</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>JSON</label>
          <textarea
            rows={6}
            className={S.textarea}
            placeholder='{"reference":"payout_001","amount":25000,"currency":"NGN"}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className={S.grid2}>
          <div>
            <label className={S.label}>Indentation</label>
            <select className={S.select} value={indent} onChange={(e) => setIndent(e.target.value)}>
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>
          <div>
            <label className={S.label}>Keys</label>
            <label className={S.check}>
              <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
              Sort alphabetically
            </label>
          </div>
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={format}>
            Format
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setOutput("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {error && <div className={S.error}>{error}</div>}
        {output && (
          <div>
            <label className={S.label}>Formatted</label>
            <textarea rows={10} readOnly className={S.textarea} value={output} />
            <div className="pg-between">
              <span className={S.meta}>{formatBytes(new Blob([output]).size)}</span>
              <button type="button" className={S.btnSecondary} onClick={copy}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const JsonValidator = () => {
  const S = {
    shell: "not-prose pg-shell",
    header: "pg-header",
    title: "pg-title",
    subtitle: "pg-subtitle",
    body: "pg-body",
    label: "pg-label",
    input: "pg-input",
    select: "pg-select",
    textarea: "pg-textarea",
    row: "pg-row",
    grid: "pg-grid",
    grid2: "pg-grid2",
    grid3: "pg-grid3",
    btnPrimary: "pg-btn-primary",
    btnSecondary: "pg-btn-secondary",
    error: "pg-note pg-error",
    ok: "pg-note pg-ok",
    warn: "pg-note pg-warn",
    meta: "pg-meta",
    check: "pg-check",
    resultRow: "pg-result-row",
    resultKey: "pg-result-key",
    resultVal: "pg-result-val",
  };
  const SUBTITLE = "Runs locally in your browser. Nothing you type leaves this page.";
  const locateJsonError = (text, message) => {
    const match = /position (\d+)/i.exec(message || "");
    if (!match) return null;
    const pos = Math.min(Number(match[1]), Math.max(text.length - 1, 0));
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const column = pos - before.lastIndexOf("\n");
    return { pos, line, column, snippet: text.split("\n")[line - 1] || "" };
  };
  const formatBytes = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(2)} KB`);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const validate = () => {
    if (!input.trim()) {
      setResult({ valid: false, message: "Enter some JSON first." });
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const type = Array.isArray(parsed) ? "array" : parsed === null ? "null" : typeof parsed;
      const count = Array.isArray(parsed)
        ? `${parsed.length} element${parsed.length === 1 ? "" : "s"}`
        : parsed && typeof parsed === "object"
          ? `${Object.keys(parsed).length} top-level key${Object.keys(parsed).length === 1 ? "" : "s"}`
          : "scalar value";
      setResult({ valid: true, type, count, size: new Blob([input]).size });
    } catch (e) {
      setResult({ valid: false, message: e.message, where: locateJsonError(input, e.message) });
    }
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>JSON validator</div>
        <div className={S.subtitle}>{SUBTITLE}</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>JSON</label>
          <textarea
            rows={8}
            className={S.textarea}
            placeholder='{"event":"payouts.initialized","data":{"status":"initiated"}}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={validate}>
            Validate
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setResult(null);
            }}
          >
            Clear
          </button>
        </div>
        {result && result.valid && (
          <div className={S.ok}>
            Valid JSON. Root is a {result.type} with {result.count}, {formatBytes(result.size)}.
          </div>
        )}
        {result && !result.valid && (
          <div>
            <div className={S.error}>{result.message}</div>
            {result.where && (
              <div className={S.body}>
                <div className={S.resultRow}>
                  <span className={S.resultKey}>Line</span>
                  <span className={S.resultVal}>{result.where.line}</span>
                </div>
                <div className={S.resultRow}>
                  <span className={S.resultKey}>Column</span>
                  <span className={S.resultVal}>{result.where.column}</span>
                </div>
                <div className={S.resultRow}>
                  <span className={S.resultKey}>Near</span>
                  <span className={S.resultVal}>{result.where.snippet.trim().slice(0, 80) || "(empty line)"}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const JsonMinifier = () => {
  const S = {
    shell: "not-prose pg-shell",
    header: "pg-header",
    title: "pg-title",
    subtitle: "pg-subtitle",
    body: "pg-body",
    label: "pg-label",
    input: "pg-input",
    select: "pg-select",
    textarea: "pg-textarea",
    row: "pg-row",
    grid: "pg-grid",
    grid2: "pg-grid2",
    grid3: "pg-grid3",
    btnPrimary: "pg-btn-primary",
    btnSecondary: "pg-btn-secondary",
    error: "pg-note pg-error",
    ok: "pg-note pg-ok",
    warn: "pg-note pg-warn",
    meta: "pg-meta",
    check: "pg-check",
    resultRow: "pg-result-row",
    resultKey: "pg-result-key",
    resultVal: "pg-result-val",
  };
  const SUBTITLE = "Runs locally in your browser. Nothing you type leaves this page.";
  const locateJsonError = (text, message) => {
    const match = /position (\d+)/i.exec(message || "");
    if (!match) return null;
    const pos = Math.min(Number(match[1]), Math.max(text.length - 1, 0));
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    const column = pos - before.lastIndexOf("\n");
    return { pos, line, column, snippet: text.split("\n")[line - 1] || "" };
  };
  const formatBytes = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(2)} KB`);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const minify = () => {
    setCopied(false);
    if (!input.trim()) {
      setError("Enter some JSON first.");
      setOutput("");
      setStats(null);
      return;
    }
    try {
      const min = JSON.stringify(JSON.parse(input));
      const before = new Blob([input]).size;
      const after = new Blob([min]).size;
      setOutput(min);
      setStats({ before, after, saved: before > 0 ? (((before - after) / before) * 100).toFixed(1) : "0.0" });
      setError("");
    } catch (e) {
      const where = locateJsonError(input, e.message);
      setError(where ? `${e.message} (line ${where.line}, column ${where.column})` : e.message);
      setOutput("");
      setStats(null);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>JSON minifier</div>
        <div className={S.subtitle}>{SUBTITLE}</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>JSON</label>
          <textarea
            rows={8}
            className={S.textarea}
            placeholder="Paste formatted JSON to strip whitespace..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={minify}>
            Minify
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setOutput("");
              setStats(null);
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {error && <div className={S.error}>{error}</div>}
        {stats && (
          <div className={S.grid3}>
            <div className={S.resultRow}>
              <span className={S.resultKey}>Original</span>
              <span className={S.resultVal}>{formatBytes(stats.before)}</span>
            </div>
            <div className={S.resultRow}>
              <span className={S.resultKey}>Minified</span>
              <span className={S.resultVal}>{formatBytes(stats.after)}</span>
            </div>
            <div className={S.resultRow}>
              <span className={S.resultKey}>Saved</span>
              <span className={S.resultVal}>{stats.saved}%</span>
            </div>
          </div>
        )}
        {output && (
          <div>
            <label className={S.label}>Minified</label>
            <textarea rows={6} readOnly className={S.textarea} value={output} />
            <div className="pg-between">
              <span className={S.meta}>Semantically identical. Key order and values are unchanged.</span>
              <button type="button" className={S.btnSecondary} onClick={copy}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const JsonToCsv = () => {
  const S = {
    shell: "not-prose pg-shell",
    header: "pg-header",
    title: "pg-title",
    subtitle: "pg-subtitle",
    body: "pg-body",
    label: "pg-label",
    input: "pg-input",
    select: "pg-select",
    textarea: "pg-textarea",
    row: "pg-row",
    grid: "pg-grid",
    grid2: "pg-grid2",
    grid3: "pg-grid3",
    btnPrimary: "pg-btn-primary",
    btnSecondary: "pg-btn-secondary",
    error: "pg-note pg-error",
    ok: "pg-note pg-ok",
    warn: "pg-note pg-warn",
    meta: "pg-meta",
    check: "pg-check",
    resultRow: "pg-result-row",
    resultKey: "pg-result-key",
    resultVal: "pg-result-val",
  };
  const SUBTITLE = "Runs locally in your browser. Nothing you type leaves this page.";
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const flatten = (value, prefix, target) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.keys(value).forEach((key) => flatten(value[key], prefix ? `${prefix}.${key}` : key, target));
    } else if (Array.isArray(value)) {
      target[prefix] = JSON.stringify(value);
    } else {
      target[prefix] = value;
    }
    return target;
  };

  const escapeCell = (value, sep) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    return /["\n\r]| /.test(text) || text.includes(sep) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const convert = () => {
    setCopied(false);
    if (!input.trim()) {
      setError("Enter a JSON array first.");
      setOutput("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (!rows.length) {
        setError("The array is empty, so there is nothing to convert.");
        setOutput("");
        return;
      }
      const flatRows = rows.map((row) => flatten(row, "", {}));
      const columns = [];
      flatRows.forEach((row) =>
        Object.keys(row).forEach((key) => {
          if (!columns.includes(key)) columns.push(key);
        })
      );
      const sep = delimiter === "tab" ? "\t" : delimiter;
      const lines = [columns.map((c) => escapeCell(c, sep)).join(sep)];
      flatRows.forEach((row) => lines.push(columns.map((c) => escapeCell(row[c], sep)).join(sep)));
      setOutput(lines.join("\n"));
      setError("");
    } catch (e) {
      setError(e.message);
      setOutput("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>JSON to CSV</div>
        <div className={S.subtitle}>{SUBTITLE}</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>JSON array</label>
          <textarea
            rows={7}
            className={S.textarea}
            placeholder='[{"reference":"pay_1","amount":25000},{"reference":"pay_2","amount":9000}]'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <label className={S.label}>Delimiter</label>
          <select className={S.select} value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
            <option value=",">Comma</option>
            <option value=";">Semicolon</option>
            <option value="tab">Tab</option>
          </select>
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={convert}>
            Convert
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setOutput("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {error && <div className={S.error}>{error}</div>}
        {output && (
          <div>
            <label className={S.label}>CSV</label>
            <textarea rows={8} readOnly className={S.textarea} value={output} />
            <div className="pg-between">
              <span className={S.meta}>Nested objects flatten to dotted columns. Arrays stay as JSON strings.</span>
              <button type="button" className={S.btnSecondary} onClick={copy}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const JsonPathTester = () => {
  const S = {
    shell: "not-prose pg-shell",
    header: "pg-header",
    title: "pg-title",
    subtitle: "pg-subtitle",
    body: "pg-body",
    label: "pg-label",
    input: "pg-input",
    select: "pg-select",
    textarea: "pg-textarea",
    row: "pg-row",
    grid: "pg-grid",
    grid2: "pg-grid2",
    grid3: "pg-grid3",
    btnPrimary: "pg-btn-primary",
    btnSecondary: "pg-btn-secondary",
    error: "pg-note pg-error",
    ok: "pg-note pg-ok",
    warn: "pg-note pg-warn",
    meta: "pg-meta",
    check: "pg-check",
    resultRow: "pg-result-row",
    resultKey: "pg-result-key",
    resultVal: "pg-result-val",
  };
  const SUBTITLE = "Runs locally in your browser. Nothing you type leaves this page.";
  const [input, setInput] = useState("");
  const [path, setPath] = useState("$");
  const [output, setOutput] = useState("");
  const [count, setCount] = useState(null);
  const [error, setError] = useState("");

  const tokenize = (expr) => {
    const trimmed = expr.trim();
    if (!trimmed.startsWith("$")) throw new Error("A JSONPath expression must start with $.");
    const tokens = [];
    let i = 1;
    while (i < trimmed.length) {
      const ch = trimmed[i];
      if (ch === ".") {
        if (trimmed[i + 1] === ".") {
          tokens.push({ type: "descend" });
          i += 2;
          continue;
        }
        i += 1;
        continue;
      }
      if (ch === "[") {
        const end = trimmed.indexOf("]", i);
        if (end === -1) throw new Error("Unclosed [ in the expression.");
        const raw = trimmed.slice(i + 1, end).trim();
        if (raw === "*") tokens.push({ type: "wildcard" });
        else if (/^-?\d+$/.test(raw)) tokens.push({ type: "index", value: Number(raw) });
        else if (/^['"].*['"]$/.test(raw)) tokens.push({ type: "key", value: raw.slice(1, -1) });
        else throw new Error(`Unsupported bracket expression: [${raw}]. Filters are not supported.`);
        i = end + 1;
        continue;
      }
      if (ch === "*") {
        tokens.push({ type: "wildcard" });
        i += 1;
        continue;
      }
      const match = /^[^.[\]*]+/.exec(trimmed.slice(i));
      if (!match) throw new Error(`Could not parse the expression near "${trimmed.slice(i)}".`);
      tokens.push({ type: "key", value: match[0] });
      i += match[0].length;
    }
    return tokens;
  };

  const collectAll = (value, out) => {
    out.push(value);
    if (Array.isArray(value)) value.forEach((v) => collectAll(v, out));
    else if (value && typeof value === "object") Object.values(value).forEach((v) => collectAll(v, out));
    return out;
  };

  const run = () => {
    if (!input.trim()) {
      setError("Enter some JSON first.");
      setOutput("");
      setCount(null);
      return;
    }
    let doc;
    try {
      doc = JSON.parse(input);
    } catch (e) {
      setError(`Invalid JSON: ${e.message}`);
      setOutput("");
      setCount(null);
      return;
    }
    try {
      let current = [doc];
      tokenize(path).forEach((token) => {
        const next = [];
        if (token.type === "descend") {
          current.forEach((node) => collectAll(node, next));
        } else if (token.type === "wildcard") {
          current.forEach((node) => {
            if (Array.isArray(node)) next.push(...node);
            else if (node && typeof node === "object") next.push(...Object.values(node));
          });
        } else if (token.type === "index") {
          current.forEach((node) => {
            if (Array.isArray(node)) {
              const idx = token.value < 0 ? node.length + token.value : token.value;
              if (idx >= 0 && idx < node.length) next.push(node[idx]);
            }
          });
        } else {
          current.forEach((node) => {
            if (node && typeof node === "object" && !Array.isArray(node) && token.value in node) {
              next.push(node[token.value]);
            }
          });
        }
        current = next;
      });
      setCount(current.length);
      setOutput(current.length ? JSON.stringify(current, null, 2) : "");
      setError(current.length ? "" : "No matches for that expression.");
    } catch (e) {
      setError(e.message);
      setOutput("");
      setCount(null);
    }
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>JSONPath tester</div>
        <div className={S.subtitle}>{SUBTITLE}</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>JSON</label>
          <textarea
            rows={7}
            className={S.textarea}
            placeholder='{"data":{"payouts":[{"id":"p_1","status":"COMPLETED"},{"id":"p_2","status":"FAILED"}]}}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <label className={S.label}>Expression</label>
          <input
            className={S.input}
            placeholder="$.data.payouts[*].status"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={run}>
            Run query
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setPath("$");
              setOutput("");
              setCount(null);
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {error && <div className={S.error}>{error}</div>}
        {output && (
          <div>
            <label className={S.label}>Matches</label>
            <textarea rows={8} readOnly className={S.textarea} value={output} />
            <div className={S.meta}>
              {count} match{count === 1 ? "" : "es"}. Supports `$`, `.key`, `['key']`, `[n]`, `[*]`, and `..` recursive
              descent. Filter expressions are not supported.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const JsonDiffChecker = () => {
  const S = {
    shell: "not-prose pg-shell",
    header: "pg-header",
    title: "pg-title",
    subtitle: "pg-subtitle",
    body: "pg-body",
    label: "pg-label",
    input: "pg-input",
    select: "pg-select",
    textarea: "pg-textarea",
    row: "pg-row",
    grid: "pg-grid",
    grid2: "pg-grid2",
    grid3: "pg-grid3",
    btnPrimary: "pg-btn-primary",
    btnSecondary: "pg-btn-secondary",
    error: "pg-note pg-error",
    ok: "pg-note pg-ok",
    warn: "pg-note pg-warn",
    meta: "pg-meta",
    check: "pg-check",
    resultRow: "pg-result-row",
    resultKey: "pg-result-key",
    resultVal: "pg-result-val",
  };
  const SUBTITLE = "Runs locally in your browser. Nothing you type leaves this page.";
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [changes, setChanges] = useState(null);
  const [error, setError] = useState("");

  const isObject = (v) => v && typeof v === "object";

  const diff = (a, b, path, out) => {
    if (a === b) return out;
    const here = path || "$";
    if (!isObject(a) || !isObject(b) || Array.isArray(a) !== Array.isArray(b)) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        out.push({ kind: "changed", path: here, from: JSON.stringify(a), to: JSON.stringify(b) });
      }
      return out;
    }
    const keys = [];
    Object.keys(a).forEach((k) => keys.push(k));
    Object.keys(b).forEach((k) => {
      if (!keys.includes(k)) keys.push(k);
    });
    keys.forEach((key) => {
      const childPath = Array.isArray(a) ? `${here}[${key}]` : `${here}.${key}`;
      const inA = Object.prototype.hasOwnProperty.call(a, key);
      const inB = Object.prototype.hasOwnProperty.call(b, key);
      if (!inB) out.push({ kind: "removed", path: childPath, from: JSON.stringify(a[key]) });
      else if (!inA) out.push({ kind: "added", path: childPath, to: JSON.stringify(b[key]) });
      else diff(a[key], b[key], childPath, out);
    });
    return out;
  };

  const compare = () => {
    if (!left.trim() || !right.trim()) {
      setError("Paste JSON into both sides first.");
      setChanges(null);
      return;
    }
    let a;
    let b;
    try {
      a = JSON.parse(left);
    } catch (e) {
      setError(`Left side is invalid JSON: ${e.message}`);
      setChanges(null);
      return;
    }
    try {
      b = JSON.parse(right);
    } catch (e) {
      setError(`Right side is invalid JSON: ${e.message}`);
      setChanges(null);
      return;
    }
    setError("");
    setChanges(diff(a, b, "", []));
  };

  const labels = { added: "Added", removed: "Removed", changed: "Changed" };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>JSON diff checker</div>
        <div className={S.subtitle}>{SUBTITLE}</div>
      </div>
      <div className={S.body}>
        <div className={S.grid2}>
          <div>
            <label className={S.label}>Left</label>
            <textarea
              rows={8}
              className={S.textarea}
              placeholder='{"status":"PROCESSING","amount":25000}'
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            />
          </div>
          <div>
            <label className={S.label}>Right</label>
            <textarea
              rows={8}
              className={S.textarea}
              placeholder='{"status":"COMPLETED","amount":25000,"settled_at":"2026-08-15T09:00:00Z"}'
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </div>
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={compare}>
            Compare
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setLeft("");
              setRight("");
              setChanges(null);
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {error && <div className={S.error}>{error}</div>}
        {changes && changes.length === 0 && <div className={S.ok}>The two documents are structurally identical.</div>}
        {changes && changes.length > 0 && (
          <div>
            <div className={S.meta}>
              {changes.length} difference{changes.length === 1 ? "" : "s"}
            </div>
            {changes.map((change) => (
              <div key={`${change.kind}-${change.path}`} className={S.resultRow}>
                <span className={S.resultKey}>
                  {labels[change.kind]} {change.path}
                </span>
                <span className={S.resultVal}>
                  {change.kind === "changed" && `${change.from} → ${change.to}`}
                  {change.kind === "added" && change.to}
                  {change.kind === "removed" && change.from}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
