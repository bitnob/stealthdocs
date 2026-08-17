
export const HmacGenerator = () => {
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

  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError("");
    if (!secret) {
      setError("Enter a secret key.");
      return;
    }
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: algorithm },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
      const hex = [...new Uint8Array(sig)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setOutput(hex);
    } catch (e) {
      setError("Could not compute the HMAC: " + e.message);
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
        <div className={S.title}>HMAC generator</div>
        <div className={S.subtitle}>
          Computed locally in your browser with the Web Crypto API. Nothing you type leaves this page.
        </div>
      </div>
      <div className={S.body}>
        <div className={S.grid}>
          <div>
            <label className={S.label}>Secret key</label>
            <input
              type="password"
              className={S.input}
              placeholder="Enter your secret key..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </div>
          <div>
            <label className={S.label}>Algorithm</label>
            <select
              className={S.select}
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="SHA-256">HMAC-SHA256</option>
              <option value="SHA-1">HMAC-SHA1</option>
            </select>
          </div>
        </div>
        <div>
          <label className={S.label}>Message to sign</label>
          <textarea
            rows={3}
            className={S.textarea}
            placeholder="Enter message to generate HMAC signature..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={generate}>
            Generate HMAC
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setSecret("");
              setMessage("");
              setOutput("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>HMAC signature (hex)</label>
          <textarea
            rows={2}
            readOnly
            className={S.textarea}
            placeholder="HMAC signature will appear here..."
            value={output}
          />
          <div className="pg-between">
            <span className={S.meta}>{output ? output.length / 2 + " bytes" : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sha256Generator = () => {
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
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError("");
    try {
      const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));
      const hex = [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setOutput(hex);
    } catch (e) {
      setError("Could not compute the hash: " + e.message);
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
        <div className={S.title}>Hash generator</div>
        <div className={S.subtitle}>
          Computed locally in your browser with the Web Crypto API. Nothing you type leaves this page.
        </div>
      </div>
      <div className={S.body}>
        <div className={S.grid}>
          <div>
            <label className={S.label}>Text to hash</label>
            <textarea
              rows={3}
              className={S.textarea}
              placeholder="Enter text to hash..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div>
            <label className={S.label}>Algorithm</label>
            <select
              className={S.select}
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
              <option value="SHA-1">SHA-1 (legacy)</option>
            </select>
          </div>
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={generate}>
            Generate hash
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setText("");
              setOutput("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>Digest (hex)</label>
          <textarea
            rows={2}
            readOnly
            className={S.textarea}
            placeholder="The hash will appear here..."
            value={output}
          />
          <div className="pg-between">
            <span className={S.meta}>{output ? output.length / 2 + " bytes" : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!output} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HashFileChecker = () => {
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

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [digest, setDigest] = useState("");
  const [expected, setExpected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatSize = (n) => {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  };

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError("");
    setDigest("");
    setFileName(file.name);
    setFileSize(file.size);
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const hash = await crypto.subtle.digest("SHA-256", reader.result);
        const hex = [...new Uint8Array(hash)]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setDigest(hex);
      } catch (err) {
        setError("Could not hash the file: " + err.message);
      }
      setBusy(false);
    };
    reader.onerror = () => {
      setError("Could not read the file.");
      setBusy(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const copy = () => {
    navigator.clipboard.writeText(digest).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const expectedClean = expected.trim().toLowerCase();
  const match = digest && expectedClean ? expectedClean === digest : null;

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>File hash checker</div>
        <div className={S.subtitle}>
          Hashed locally in your browser with the Web Crypto API. Your file is never uploaded anywhere.
        </div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>Select a file</label>
          <input
            type="file"
            className="pg-file"
            style={{ colorScheme: "auto" }}
            onChange={onFile}
          />
        </div>
        {fileName && (
          <div className={S.meta}>
            {fileName} ({formatSize(fileSize)}){busy ? " - hashing..." : ""}
          </div>
        )}
        {error && <div className={S.error}>{error}</div>}
        <div>
          <label className={S.label}>SHA-256 digest (hex)</label>
          <textarea
            rows={2}
            readOnly
            className={S.textarea}
            placeholder="Pick a file to compute its SHA-256 hash..."
            value={digest}
          />
          <div className="pg-end">
            <button type="button" className={S.btnSecondary} disabled={!digest} onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div>
          <label className={S.label}>Expected hash (optional)</label>
          <input
            type="text"
            className={S.input}
            placeholder="Paste the published SHA-256 hash to compare..."
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
          />
        </div>
        {match === true && <div className={S.ok}>Match. The file hash equals the expected hash.</div>}
        {match === false && (
          <div className={S.error}>Mismatch. The file hash does not equal the expected hash.</div>
        )}
      </div>
    </div>
  );
};

export const BitcoinAddressValidator = () => {
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

  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const validateBech32 = (addr) => {
    const B32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    const polymod = (values) => {
      const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
      let chk = 1;
      for (const v of values) {
        const top = chk >>> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ v;
        for (let i = 0; i < 5; i++) {
          if ((top >>> i) & 1) chk ^= GEN[i];
        }
      }
      return chk >>> 0;
    };
    const hrpExpand = (hrp) => {
      const out = [];
      for (const c of hrp) out.push(c.charCodeAt(0) >>> 5);
      out.push(0);
      for (const c of hrp) out.push(c.charCodeAt(0) & 31);
      return out;
    };
    const fromWords = (words) => {
      let acc = 0;
      let bits = 0;
      const out = [];
      for (const w of words) {
        acc = (acc << 5) | w;
        bits += 5;
        while (bits >= 8) {
          bits -= 8;
          out.push((acc >> bits) & 255);
        }
      }
      if (bits >= 5 || ((acc << (8 - bits)) & 255)) return null;
      return out;
    };

    if (addr !== addr.toLowerCase() && addr !== addr.toUpperCase()) {
      return { valid: false, reason: "Mixed case is not allowed in bech32 addresses." };
    }
    const lower = addr.toLowerCase();
    const pos = lower.lastIndexOf("1");
    if (pos < 1 || pos + 7 > lower.length || lower.length > 90) {
      return { valid: false, reason: "Malformed bech32 string." };
    }
    const hrp = lower.slice(0, pos);
    const data = [];
    for (const ch of lower.slice(pos + 1)) {
      const i = B32.indexOf(ch);
      if (i === -1) return { valid: false, reason: 'Invalid character "' + ch + '" in the data part.' };
      data.push(i);
    }
    const chk = polymod([...hrpExpand(hrp), ...data]);
    let encoding;
    if (chk === 1) encoding = "bech32";
    else if (chk === 0x2bc830a3) encoding = "bech32m";
    else return { valid: false, reason: "Checksum verification failed. The address likely contains a typo." };
    const words = data.slice(0, -6);
    const version = words[0];
    if (version === undefined || version > 16) {
      return { valid: false, reason: "Invalid witness version." };
    }
    const program = fromWords(words.slice(1));
    if (!program || program.length < 2 || program.length > 40) {
      return { valid: false, reason: "Invalid witness program length." };
    }
    if (version === 0 && encoding !== "bech32") {
      return { valid: false, reason: "Witness v0 addresses must use bech32 encoding, not bech32m." };
    }
    if (version > 0 && encoding !== "bech32m") {
      return { valid: false, reason: "Witness v" + version + " addresses must use bech32m encoding." };
    }
    if (version === 0 && program.length !== 20 && program.length !== 32) {
      return { valid: false, reason: "Witness v0 programs must be 20 or 32 bytes." };
    }
    const network = hrp === "bc" ? "Mainnet" : hrp === "tb" ? "Testnet" : hrp === "bcrt" ? "Regtest" : null;
    if (!network) return { valid: false, reason: 'Unknown address prefix "' + hrp + '".' };
    let type;
    if (version === 0) type = program.length === 20 ? "P2WPKH (segwit v0)" : "P2WSH (segwit v0)";
    else if (version === 1 && program.length === 32) type = "P2TR (taproot)";
    else type = "Witness v" + version;
    return { valid: true, type, network, encoding };
  };

  const validateBase58 = async (addr) => {
    const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = 0n;
    for (const ch of addr) {
      const i = B58.indexOf(ch);
      if (i === -1) return { valid: false, reason: 'Invalid base58 character "' + ch + '".' };
      num = num * 58n + BigInt(i);
    }
    const bytes = [];
    while (num > 0n) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }
    for (const ch of addr) {
      if (ch === "1") bytes.unshift(0);
      else break;
    }
    if (bytes.length !== 25) {
      return { valid: false, reason: "Decoded payload is " + bytes.length + " bytes, expected 25." };
    }
    const payload = new Uint8Array(bytes.slice(0, 21));
    const checksum = bytes.slice(21);
    const h1 = await crypto.subtle.digest("SHA-256", payload);
    const h2 = new Uint8Array(await crypto.subtle.digest("SHA-256", h1));
    for (let i = 0; i < 4; i++) {
      if (h2[i] !== checksum[i]) {
        return { valid: false, reason: "Checksum verification failed. The address likely contains a typo." };
      }
    }
    const version = bytes[0];
    const map = {
      0: ["P2PKH (legacy)", "Mainnet"],
      5: ["P2SH", "Mainnet"],
      111: ["P2PKH (legacy)", "Testnet"],
      196: ["P2SH", "Testnet"],
    };
    if (!map[version]) {
      return { valid: false, reason: "Unknown version byte 0x" + version.toString(16).padStart(2, "0") + "." };
    }
    return { valid: true, type: map[version][0], network: map[version][1], encoding: "base58check" };
  };

  const validate = async () => {
    setResult(null);
    setError("");
    const addr = address.trim();
    if (!addr) {
      setError("Enter an address to validate.");
      return;
    }
    try {
      const lower = addr.toLowerCase();
      if (lower.startsWith("bc1") || lower.startsWith("tb1") || lower.startsWith("bcrt1")) {
        setResult(validateBech32(addr));
      } else {
        setResult(await validateBase58(addr));
      }
    } catch (e) {
      setError("Could not validate the address: " + e.message);
    }
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>Bitcoin address validator</div>
        <div className={S.subtitle}>
          Checked locally in your browser. Nothing you type leaves this page.
        </div>
      </div>
      <div className={S.body}>
        <div>
          <label className={S.label}>Bitcoin address</label>
          <input
            type="text"
            className={S.input}
            placeholder="1A1zP1... / 3J98t1... / bc1q... / bc1p..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") validate();
            }}
          />
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={validate}>
            Validate
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setAddress("");
              setResult(null);
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        {result && !result.valid && <div className={S.error}>Invalid address. {result.reason}</div>}
        {result && result.valid && (
          <div className={S.ok}>
            <div className="pg-strong">Valid address</div>
            <div className={S.resultRow}>
              <span className={S.resultKey}>Type</span>
              <span className={S.resultVal}>{result.type}</span>
            </div>
            <div className={S.resultRow}>
              <span className={S.resultKey}>Network</span>
              <span className={S.resultVal}>{result.network}</span>
            </div>
            <div className={S.resultRow}>
              <span className={S.resultKey}>Encoding</span>
              <span className={S.resultVal}>{result.encoding}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const UuidGenerator = () => {
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

  const [quantity, setQuantity] = useState(1);
  const [uuids, setUuids] = useState([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setUuids(Array.from({ length: quantity }, () => crypto.randomUUID()));
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>UUID generator</div>
        <div className={S.subtitle}>
          Generated locally in your browser with the Web Crypto API. Nothing leaves this page.
        </div>
      </div>
      <div className={S.body}>
        <div className={S.grid}>
          <div>
            <label className={S.label}>Quantity</label>
            <select
              className={S.select}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={generate}>
            Generate UUIDs
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => setUuids([])}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>UUID v4 output</label>
          <textarea
            rows={Math.max(2, Math.min(10, uuids.length))}
            readOnly
            className={S.textarea}
            placeholder="Generated UUIDs will appear here..."
            value={uuids.join("\n")}
          />
          <div className="pg-between">
            <span className={S.meta}>{uuids.length ? uuids.length + " UUID" + (uuids.length > 1 ? "s" : "") : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!uuids.length} onClick={copyAll}>
              {copied ? "Copied!" : "Copy all"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RandomStringGenerator = () => {
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

  const [length, setLength] = useState(32);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [output, setOutput] = useState("");
  const [entropy, setEntropy] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setError("");
    let charset = "";
    if (lower) charset += "abcdefghijklmnopqrstuvwxyz";
    if (upper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (digits) charset += "0123456789";
    if (symbols) charset += "!@#$%^&*()-_=+[]{};:,.<>?";
    if (!charset) {
      setError("Select at least one character set.");
      return;
    }
    const len = Math.min(128, Math.max(8, Number(length) || 8));
    setLength(len);
    const limit = 256 - (256 % charset.length);
    let out = "";
    while (out.length < len) {
      const buf = crypto.getRandomValues(new Uint8Array(len * 2));
      for (const b of buf) {
        if (b < limit && out.length < len) out += charset[b % charset.length];
      }
    }
    setOutput(out);
    setEntropy(Math.floor(len * Math.log2(charset.length)));
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
        <div className={S.title}>Random string generator</div>
        <div className={S.subtitle}>
          Generated locally in your browser with crypto.getRandomValues. Nothing leaves this page.
        </div>
      </div>
      <div className={S.body}>
        <div className={S.grid}>
          <div>
            <label className={S.label}>Length (8 to 128)</label>
            <input
              type="number"
              min={8}
              max={128}
              className={S.input}
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>
          <div>
            <label className={S.label}>Character sets</label>
            <div className="pg-wrap">
              <label className={S.check}>
                <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} />
                Lowercase (a-z)
              </label>
              <label className={S.check}>
                <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />
                Uppercase (A-Z)
              </label>
              <label className={S.check}>
                <input type="checkbox" checked={digits} onChange={(e) => setDigits(e.target.checked)} />
                Digits (0-9)
              </label>
              <label className={S.check}>
                <input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />
                Symbols
              </label>
            </div>
          </div>
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={generate}>
            Generate string
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setOutput("");
              setEntropy(0);
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>Random string</label>
          <textarea
            rows={2}
            readOnly
            className={S.textarea}
            placeholder="The random string will appear here..."
            value={output}
          />
          <div className="pg-between">
            <span className={S.meta}>
              {output ? "About " + entropy + " bits of entropy" : ""}
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

export const PrivateKeyGenerator = () => {
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

  const [hexKey, setHexKey] = useState("");
  const [wif, setWif] = useState("");
  const [error, setError] = useState("");
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedWif, setCopiedWif] = useState(false);

  const generate = async () => {
    setError("");
    try {
      const CURVE_N = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";
      let bytes;
      let hex;
      do {
        bytes = crypto.getRandomValues(new Uint8Array(32));
        hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
      } while (hex >= CURVE_N || /^0+$/.test(hex));

      const payload = new Uint8Array(34);
      payload[0] = 0x80;
      payload.set(bytes, 1);
      payload[33] = 0x01;
      const h1 = await crypto.subtle.digest("SHA-256", payload);
      const h2 = new Uint8Array(await crypto.subtle.digest("SHA-256", h1));
      const full = new Uint8Array(38);
      full.set(payload);
      full.set(h2.slice(0, 4), 34);

      const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      let num = 0n;
      for (const b of full) num = num * 256n + BigInt(b);
      let encoded = "";
      while (num > 0n) {
        encoded = B58[Number(num % 58n)] + encoded;
        num = num / 58n;
      }
      for (const b of full) {
        if (b === 0) encoded = "1" + encoded;
        else break;
      }

      setHexKey(hex);
      setWif(encoded);
    } catch (e) {
      setError("Could not generate the key: " + e.message);
    }
  };

  const copyHex = () => {
    navigator.clipboard.writeText(hexKey).then(() => {
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 1500);
    });
  };

  const copyWif = () => {
    navigator.clipboard.writeText(wif).then(() => {
      setCopiedWif(true);
      setTimeout(() => setCopiedWif(false), 1500);
    });
  };

  return (
    <div className={S.shell}>
      <div className={S.header}>
        <div className={S.title}>Bitcoin private key generator</div>
        <div className={S.subtitle}>
          Generated locally in your browser. Nothing leaves this page.
        </div>
      </div>
      <div className={S.body}>
        <div className={S.warn}>
          For education and testing only. Browser-generated keys are not safe for real funds. Never
          send bitcoin to an address derived from a key made with this tool.
        </div>
        {error && <div className={S.error}>{error}</div>}
        <div className={S.row}>
          <button type="button" className={S.btnPrimary} onClick={generate}>
            Generate private key
          </button>
          <button
            type="button"
            className={S.btnSecondary}
            onClick={() => {
              setHexKey("");
              setWif("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>
        <div>
          <label className={S.label}>Private key (hex, 32 bytes)</label>
          <textarea
            rows={2}
            readOnly
            className={S.textarea}
            placeholder="A 64-character hex private key will appear here..."
            value={hexKey}
          />
          <div className="pg-end">
            <button type="button" className={S.btnSecondary} disabled={!hexKey} onClick={copyHex}>
              {copiedHex ? "Copied!" : "Copy hex"}
            </button>
          </div>
        </div>
        <div>
          <label className={S.label}>WIF (mainnet, compressed)</label>
          <textarea
            rows={2}
            readOnly
            className={S.textarea}
            placeholder="The wallet import format key will appear here..."
            value={wif}
          />
          <div className="pg-between">
            <span className={S.meta}>{wif ? "Starts with K or L for compressed mainnet keys" : ""}</span>
            <button type="button" className={S.btnSecondary} disabled={!wif} onClick={copyWif}>
              {copiedWif ? "Copied!" : "Copy WIF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
