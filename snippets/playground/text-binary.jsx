
export const Base64Tool = ({ mode = "encode" }) => {
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

  const isEncode = mode === "encode";
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = () => {
    setError("");
    setOutput("");
    try {
      if (isEncode) {
        const bytes = new TextEncoder().encode(input);
        let bin = "";
        for (const b of bytes) bin += String.fromCharCode(b);
        let b64 = btoa(bin);
        if (urlSafe) b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        setOutput(b64);
      } else {
        let s = input.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
        s = s.replace(/=+$/, "");
        if (/[^A-Za-z0-9+/]/.test(s)) {
          setError("Input contains characters that are not valid base64. Allowed: A-Z, a-z, 0-9, +, /, - and _ for the URL-safe variant, and = padding.");
          return;
        }
        if (s.length % 4 === 1) {
          setError("Invalid base64 length. A base64 string can never have a length of 4n+1 after removing padding.");
          return;
        }
        while (s.length % 4 !== 0) s += "=";
        let bin;
        try {
          bin = atob(s);
        } catch (e) {
          setError("Could not decode: the input is not valid base64.");
          return;
        }
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try {
          setOutput(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        } catch (e) {
          setError("Decoded successfully, but the bytes are not valid UTF-8 text. The raw bytes in hex: " + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(" "));
          return;
        }
      }
    } catch (e) {
      setError("Something went wrong: " + e.message);
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
        <div className={S.title}>{isEncode ? "Base64 encoder" : "Base64 decoder"}</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>{isEncode ? "Text to encode" : "Base64 to decode"}</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder={isEncode ? "Enter text to encode as base64..." : "Enter a base64 string, standard or URL-safe, padded or not..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        {isEncode && (
          <label className="pg-checklabel">
            <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
            URL-safe variant (uses - and _ instead of + and /, no padding)
          </label>
        )}
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={run}>
            {isEncode ? "Encode" : "Decode"}
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
        <div>
          <label className={S.label}>{isEncode ? "Base64 output" : "Decoded text"}</label>
          <textarea rows={4} readOnly className={S.textarea} placeholder="Output will appear here..." value={output} />
          <div className="pg-between">
            <span className={S.meta}>{output ? output.length + " characters" : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HexTool = ({ mode = "encode" }) => {
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

  const isEncode = mode === "encode";
  const [input, setInput] = useState("");
  const [prefix, setPrefix] = useState(false);
  const [spacing, setSpacing] = useState("space");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = () => {
    setError("");
    setOutput("");
    if (isEncode) {
      const bytes = new TextEncoder().encode(input);
      const hexBytes = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
      if (spacing === "space") {
        setOutput(hexBytes.map((h) => (prefix ? "0x" + h : h)).join(" "));
      } else {
        setOutput((prefix ? "0x" : "") + hexBytes.join(""));
      }
    } else {
      const cleaned = input
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((t) => t.replace(/^0x/i, ""))
        .join("");
      if (!cleaned) {
        setError("Enter a hex string to decode.");
        return;
      }
      if (/[^0-9a-fA-F]/.test(cleaned)) {
        const bad = cleaned.match(/[^0-9a-fA-F]/)[0];
        setError('Invalid character "' + bad + '". Hex uses only 0-9 and a-f (either case), with optional 0x prefixes, spaces and commas.');
        return;
      }
      if (cleaned.length % 2 !== 0) {
        setError("Odd number of hex digits (" + cleaned.length + "). Each byte needs exactly two digits.");
        return;
      }
      const bytes = new Uint8Array(cleaned.length / 2);
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
      try {
        setOutput(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      } catch (e) {
        setError("The hex is valid but the bytes are not valid UTF-8 text, so there is no text representation to show.");
      }
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
        <div className={S.title}>{isEncode ? "Hex encoder" : "Hex decoder"}</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>{isEncode ? "Text to encode" : "Hex to decode"}</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder={isEncode ? "Enter text to convert to hex bytes..." : "e.g. 68 65 6c 6c 6f or 0x68,0x65 or 68656C6C6F..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        {isEncode && (
          <div className="pg-grid2">
            <div>
              <label className={S.label}>Byte separator</label>
              <select className={S.select} value={spacing} onChange={(e) => setSpacing(e.target.value)}>
                <option value="space">Space between bytes</option>
                <option value="none">No separator</option>
              </select>
            </div>
            <div className="pg-endpad">
              <label className="pg-checklabel">
                <input type="checkbox" checked={prefix} onChange={(e) => setPrefix(e.target.checked)} />
                0x prefix
              </label>
            </div>
          </div>
        )}
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={run}>
            {isEncode ? "Encode" : "Decode"}
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
        <div>
          <label className={S.label}>{isEncode ? "Hex output" : "Decoded text"}</label>
          <textarea rows={4} readOnly className={S.textarea} placeholder="Output will appear here..." value={output} />
          <div className="pg-between">
            <span className={S.meta}>
              {output && isEncode ? new TextEncoder().encode(input).length + " bytes" : output ? output.length + " characters" : ""}
            </span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Utf8Tool = ({ mode = "encode" }) => {
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

  const isEncode = mode === "encode";
  const [input, setInput] = useState("");
  const [view, setView] = useState("hex");
  const [base, setBase] = useState("decimal");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [inspect, setInspect] = useState([]);

  const run = () => {
    setError("");
    setOutput("");
    setInspect([]);
    if (isEncode) {
      const bytes = new TextEncoder().encode(input);
      if (view === "hex") {
        setOutput([...bytes].map((b) => b.toString(16).padStart(2, "0")).join(" "));
      } else {
        setOutput([...bytes].join(" "));
      }
      const chars = [...input].slice(0, 20);
      setInspect(
        chars.map((ch) => ({
          ch,
          cp: "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"),
          bytes: new TextEncoder().encode(ch).length,
        }))
      );
    } else {
      const tokens = input.trim().split(/[\s,]+/).filter(Boolean);
      if (tokens.length === 0) {
        setError("Enter a list of byte values, separated by spaces or commas.");
        return;
      }
      const bytes = new Uint8Array(tokens.length);
      for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i].replace(/^0x/i, "");
        const radix = base === "hex" || /^0x/i.test(tokens[i]) ? 16 : 10;
        const valid = radix === 16 ? /^[0-9a-fA-F]{1,2}$/.test(t) : /^[0-9]{1,3}$/.test(t);
        if (!valid) {
          setError('"' + tokens[i] + '" is not a valid ' + (radix === 16 ? "hex" : "decimal") + " byte value.");
          return;
        }
        const v = parseInt(t, radix);
        if (v > 255) {
          setError('"' + tokens[i] + '" is out of range. A byte must be between 0 and 255.');
          return;
        }
        bytes[i] = v;
      }
      try {
        setOutput(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      } catch (e) {
        setError("These bytes are not a valid UTF-8 sequence. Check for truncated multi-byte characters or stray continuation bytes.");
      }
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
        <div className={S.title}>{isEncode ? "UTF-8 encoder" : "UTF-8 decoder"}</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>{isEncode ? "Text to encode" : "Byte values to decode"}</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder={isEncode ? "Enter text to view as UTF-8 bytes..." : "e.g. 104 101 108 108 111 or e2 9c 93, separated by spaces or commas..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className={S.row}>
          {isEncode ? (
            <>
              <span className="pg-inline-label">Byte view:</span>
              {["hex", "decimal"].map((v) => (
                <label key={v} className="pg-checklabel-tight">
                  <input type="radio" name="utf8-view" checked={view === v} onChange={() => setView(v)} />
                  {v === "hex" ? "Hex" : "Decimal"}
                </label>
              ))}
            </>
          ) : (
            <>
              <span className="pg-inline-label">Input base:</span>
              {["decimal", "hex"].map((v) => (
                <label key={v} className="pg-checklabel-tight">
                  <input type="radio" name="utf8-base" checked={base === v} onChange={() => setBase(v)} />
                  {v === "hex" ? "Hex" : "Decimal"}
                </label>
              ))}
            </>
          )}
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={run}>
            {isEncode ? "Encode" : "Decode"}
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setOutput("");
              setError("");
              setInspect([]);
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>{isEncode ? "UTF-8 bytes" : "Decoded text"}</label>
          <textarea rows={4} readOnly className={S.textarea} placeholder="Output will appear here..." value={output} />
          <div className="pg-between">
            <span className={S.meta}>
              {output && isEncode ? new TextEncoder().encode(input).length + " bytes" : output ? [...output].length + " characters" : ""}
            </span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        {inspect.length > 0 && (
          <div>
            <label className={S.label}>Code point inspector (first 20 characters)</label>
            <div className="pg-tablewrap">
              <table className="pg-table">
                <thead>
                  <tr >
                    <th className="px-3 py-2 font-medium">Char</th>
                    <th className="px-3 py-2 font-medium">Code point</th>
                    <th className="px-3 py-2 font-medium">UTF-8 bytes</th>
                  </tr>
                </thead>
                <tbody>
                  {inspect.map((r, i) => (
                    <tr key={i} >
                      <td className="px-3 py-1.5 font-mono">{r.ch === " " ? "␣" : r.ch}</td>
                      <td className="px-3 py-1.5 font-mono">{r.cp}</td>
                      <td className="px-3 py-1.5 font-mono">{r.bytes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const UrlTool = ({ mode = "encode" }) => {
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

  const isEncode = mode === "encode";
  const [input, setInput] = useState("");
  const [fn, setFn] = useState("component");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = () => {
    setError("");
    setOutput("");
    try {
      if (isEncode) {
        setOutput(fn === "component" ? encodeURIComponent(input) : encodeURI(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (e) {
      setError("Could not decode: the input contains a malformed percent-sequence (for example a lone % or %ZZ).");
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
        <div className={S.title}>{isEncode ? "URL encoder" : "URL decoder"}</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>{isEncode ? "Text to encode" : "Percent-encoded text to decode"}</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder={isEncode ? "Enter text or a URL to percent-encode..." : "e.g. hello%20world%3Fname%3Dvalue..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        {isEncode && (
          <div className={S.row}>
            <span className="pg-inline-label">Function:</span>
            <label className="pg-checklabel-tight">
              <input type="radio" name="url-fn" checked={fn === "component"} onChange={() => setFn("component")} />
              encodeURIComponent (single value)
            </label>
            <label className="pg-checklabel-tight">
              <input type="radio" name="url-fn" checked={fn === "uri"} onChange={() => setFn("uri")} />
              encodeURI (whole URL)
            </label>
          </div>
        )}
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={run}>
            {isEncode ? "Encode" : "Decode"}
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
        <div>
          <label className={S.label}>{isEncode ? "Encoded output" : "Decoded text"}</label>
          <textarea rows={4} readOnly className={S.textarea} placeholder="Output will appear here..." value={output} />
          <div className="pg-between">
            <span className={S.meta}>{output ? output.length + " characters" : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AsciiBinaryConverter = () => {
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

  const [text, setText] = useState("");
  const [binary, setBinary] = useState("");
  const [error, setError] = useState("");

  const toBinary = () => {
    setError("");
    const bytes = new TextEncoder().encode(text);
    setBinary([...bytes].map((b) => b.toString(2).padStart(8, "0")).join(" "));
  };

  const toText = () => {
    setError("");
    const cleaned = binary.replace(/\s/g, "");
    if (!cleaned) {
      setError("Enter binary to convert.");
      return;
    }
    if (/[^01]/.test(cleaned)) {
      setError("Binary input can only contain 0, 1 and whitespace.");
      return;
    }
    if (cleaned.length % 8 !== 0) {
      setError("Binary length must be a multiple of 8. You have " + cleaned.length + " bits; each character is one or more 8-bit bytes.");
      return;
    }
    const bytes = new Uint8Array(cleaned.length / 8);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(cleaned.slice(i * 8, i * 8 + 8), 2);
    try {
      setText(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch (e) {
      setError("The bits form bytes that are not valid UTF-8 text. Check for mistyped groups.");
    }
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>ASCII / binary converter</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>Text</label>
          <textarea
            rows={3}
            className={S.textarea}
            placeholder="Enter text, e.g. Hi..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={toBinary}>
            Text to binary ↓
          </button>
          <button type="button" className={S.btnPrimary} onClick={toText}>
            Binary to text ↑
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setText("");
              setBinary("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>Binary (space-separated 8-bit groups)</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder="e.g. 01001000 01101001..."
            value={binary}
            onChange={(e) => setBinary(e.target.value)}
          />
          <div className="mt-2">
            <span className={S.meta}>{binary.replace(/\s/g, "").length > 0 ? binary.replace(/\s/g, "").length + " bits" : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Rot13Cipher = () => {
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

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const apply = () => {
    setOutput(
      input.replace(/[a-zA-Z]/g, (ch) => {
        const base = ch <= "Z" ? 65 : 97;
        return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
      })
    );
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
        <div className={S.title}>ROT13 cipher</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>Text</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder="Enter text to rotate by 13. Applying ROT13 twice returns the original..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={apply}>
            Apply ROT13
          </button>
          <button type="button" className={S.btnSecondary} disabled={!output} onClick={() => setInput(output)}>
            Use output as input
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setInput("");
              setOutput("");
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>Output</label>
          <textarea rows={4} readOnly className={S.textarea} placeholder="Output will appear here..." value={output} />
          <div className="pg-between">
            <span className={S.meta}>Case and non-letters are preserved. ROT13 is its own inverse.</span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Base32Converter = () => {
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

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = () => {
    setError("");
    setOutput("");
    if (mode === "encode") {
      const bytes = new TextEncoder().encode(input);
      let out = "";
      let value = 0;
      let bits = 0;
      for (const b of bytes) {
        value = (value << 8) | b;
        bits += 8;
        while (bits >= 5) {
          out += ALPHABET[(value >>> (bits - 5)) & 31];
          bits -= 5;
        }
      }
      if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
      while (out.length % 8 !== 0) out += "=";
      setOutput(out);
    } else {
      const clean = input.toUpperCase().replace(/[\s=]/g, "");
      const bytes = [];
      let value = 0;
      let bits = 0;
      for (const ch of clean) {
        const idx = ALPHABET.indexOf(ch);
        if (idx === -1) {
          setError('"' + ch + '" is not a valid base32 character. The RFC 4648 alphabet is A-Z and 2-7.');
          return;
        }
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
          bytes.push((value >>> (bits - 8)) & 255);
          bits -= 8;
        }
      }
      try {
        setOutput(new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)));
      } catch (e) {
        setError("Valid base32, but the decoded bytes are not UTF-8 text. Hex: " + bytes.map((b) => b.toString(16).padStart(2, "0")).join(" "));
      }
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
        <div className={S.title}>Base32 converter</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div className={S.row}>
          <span className="pg-inline-label">Mode:</span>
          <label className="pg-checklabel-tight">
            <input type="radio" name="b32-mode" checked={mode === "encode"} onChange={() => setMode("encode")} />
            Encode
          </label>
          <label className="pg-checklabel-tight">
            <input type="radio" name="b32-mode" checked={mode === "decode"} onChange={() => setMode("decode")} />
            Decode
          </label>
        </div>
        <div>
          <label className={S.label}>{mode === "encode" ? "Text to encode" : "Base32 to decode"}</label>
          <textarea
            rows={4}
            className={S.textarea}
            placeholder={mode === "encode" ? "Enter text, e.g. foobar..." : "e.g. MZXW6YTBOI====== (case and padding are optional)..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={run}>
            {mode === "encode" ? "Encode" : "Decode"}
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
        <div>
          <label className={S.label}>{mode === "encode" ? "Base32 output" : "Decoded text"}</label>
          <textarea rows={4} readOnly className={S.textarea} placeholder="Output will appear here..." value={output} />
          <div className="pg-between">
            <span className={S.meta}>{output ? output.length + " characters" : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StringByteInspector = () => {
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

  const [input, setInput] = useState("");

  const codePoints = [...input];
  const utf8Bytes = new TextEncoder().encode(input).length;
  const stats = [
    { label: "Characters (code points)", value: codePoints.length },
    { label: "UTF-16 code units", value: input.length },
    { label: "UTF-8 bytes", value: utf8Bytes },
  ];
  const rows = codePoints.slice(0, 30).map((ch) => ({
    ch,
    cp: "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"),
    hex: [...new TextEncoder().encode(ch)].map((b) => b.toString(16).padStart(2, "0")).join(" "),
  }));

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>String byte inspector</div>
        <div className={S.subtitle}>Runs locally in your browser. Nothing you type leaves this page.</div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>Text to inspect</label>
          <textarea
            rows={3}
            className={S.textarea}
            placeholder="Type or paste text. Try emoji or accented characters..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="pg-grid3">
          {stats.map((s) => (
            <div key={s.label} className="pg-stat">
              <div className="pg-stat-label">{s.label}</div>
              <div className="pg-stat-value">{s.value}</div>
            </div>
          ))}
        </div>
        <div className={S.meta}>
          Character counts here are code points, not grapheme clusters. A family emoji or a flag can be several code points that render as one visible character.
        </div>
        {rows.length > 0 && (
          <div>
            <label className={S.label}>Per-character breakdown (first 30 code points)</label>
            <div className="pg-tablewrap">
              <table className="pg-table">
                <thead>
                  <tr >
                    <th className="px-3 py-2 font-medium">Char</th>
                    <th className="px-3 py-2 font-medium">Code point</th>
                    <th className="px-3 py-2 font-medium">UTF-8 bytes (hex)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} >
                      <td className="px-3 py-1.5 font-mono">{r.ch === " " ? "␣" : r.ch}</td>
                      <td className="px-3 py-1.5 font-mono">{r.cp}</td>
                      <td className="px-3 py-1.5 font-mono">{r.hex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
