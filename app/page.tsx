"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:8000";

interface StatusRes { status: string; chunks: number; error: string | null }
interface Source    { page: number; text: string }
interface QueryRes  { query: string; answer: string; sources: Source[] }

function useStatus(ms = 4000) {
  const [s, setS]           = useState<StatusRes>({ status: "idle", chunks: 0, error: null });
  const [reachable, setR]   = useState(true);
  const poll = useCallback(async () => {
    try {
      const r = await fetch(`${API}/status`);
      if (r.ok) { setS(await r.json()); setR(true); }
    } catch { setR(false); }
  }, []);
  useEffect(() => { poll(); const t = setInterval(poll, ms); return () => clearInterval(t); }, [poll, ms]);
  return { status: s, reachable, refetch: poll };
}

function Spinner() {
  return (
    <span style={{
      width: 13, height: 13, flexShrink: 0,
      border: "2px solid rgba(255,255,255,0.2)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.7s linear infinite",
    }}/>
  );
}

export default function Dashboard() {
  const { status, reachable, refetch } = useStatus();

  // Upload state
  const [file, setFile]           = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver]   = useState(false);

  // Query state — completely independent
  const [query, setQuery]       = useState("");
  const [querying, setQuerying] = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [answer, setAnswer]     = useState<string | null>(null);
  const [sources, setSources]   = useState<Source[]>([]);
  const [queryErr, setQueryErr] = useState("");

  // Elapsed timer while querying
  useEffect(() => {
    if (!querying) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [querying]);

  // DB preview — populated only after user runs a query (sources come back for free)
  // Also reset when DB is cleared
  useEffect(() => {
    if (status.status === "idle") {
      setSources([]);
      setAnswer(null);
      setQuery("");
      setQueryErr("");
    }
  }, [status.status]);

  // Upload
  async function handleUpload() {
    if (!file || uploading || status.status === "processing") return;
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`${API}/upload`, { method: "POST", body: fd });
      const d = await r.json();
      setUploadMsg({ text: d.message ?? d.detail ?? "Done.", ok: r.ok });
      if (r.ok) {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setUploadMsg({ text: "Cannot reach backend. Make sure FastAPI is running on :8000 with CORS middleware.", ok: false });
    }
    setUploading(false);
    refetch();
  }

  // Reset
  async function handleReset() {
    try {
      await fetch(`${API}/reset`);
      setUploadMsg(null);
      refetch();
    } catch {}
  }

  // Query
  async function handleQuery() {
    const q = query.trim();
    if (!q || querying || status.status !== "done") return;

    setQuerying(true);
    setAnswer(null);
    setSources([]);
    setQueryErr("");

    try {
      const r = await fetch(`${API}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, temperature: 0.7, max_new_tokens: 100 }),
      });
      const d: QueryRes = await r.json();
      if (r.ok) {
        setAnswer(d.answer);
        setSources(d.sources ?? []);
      } else {
        setQueryErr((d as unknown as { detail?: string }).detail ?? "Query failed.");
      }
    } catch {
      setQueryErr("Network error — is the backend running?");
    }

    // Always unblock the input, no matter what happened
    setQuerying(false);
  }

  const canQuery = status.status === "done" && !querying;
  const isProc   = status.status === "processing";
  const dotColor = { idle: "#4b5563", processing: "#f59e0b", done: "#22c55e", failed: "#f87171" }[status.status] ?? "#4b5563";

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.8)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .fade-in  { animation: fadeUp 0.35s ease forwards; opacity: 0; }
        .delay-1  { animation-delay: 0.06s; }
        .delay-2  { animation-delay: 0.12s; }
        .delay-3  { animation-delay: 0.18s; }

        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace !important; }

        .card {
          background: #0c0c0c;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 1.5rem;
        }
        .lbl {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.11em;
          text-transform: uppercase; color: #4b5563; margin-bottom: 0.9rem;
        }

        textarea {
          background: #111;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          line-height: 1.65;
          outline: none;
          padding: 0.85rem 1rem;
          width: 100%;
          resize: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        textarea:focus { border-color: rgba(59,130,246,0.55); box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        textarea::placeholder { color: #2d3748; }
        textarea:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.72rem 1.4rem;
          background: #3b82f6; color: #fff;
          border: none; border-radius: 10px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.85rem;
          cursor: pointer; transition: all 0.14s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #2563eb; transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(59,130,246,0.35);
        }
        .btn-primary:disabled { background: #1a2030; color: #2d3748; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-ghost {
          background: transparent; color: #6b7280;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px; padding: 0.38rem 0.85rem;
          font-size: 0.72rem; font-weight: 500; cursor: pointer; transition: all 0.13s;
        }
        .btn-ghost:hover { color: #d1d5db; border-color: rgba(255,255,255,0.18); }

        .drop-zone {
          border: 1.5px dashed rgba(255,255,255,0.10);
          border-radius: 12px; padding: 2.2rem 1rem;
          text-align: center; cursor: pointer; transition: all 0.16s;
        }
        .drop-zone:hover, .drop-zone.drag { border-color: rgba(59,130,246,0.45); background: rgba(59,130,246,0.04); }
        .drop-zone.filled { border-color: rgba(59,130,246,0.40); background: rgba(59,130,246,0.06); border-style: solid; }

        .pill {
          display: inline-flex; align-items: center;
          font-size: 0.58rem; font-weight: 700; padding: 0.18rem 0.6rem;
          border-radius: 100px; font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#000", padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* HEADER  */}
        <div className="fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>Dashboard</h1>
            <p style={{ fontSize: "0.77rem", color: "#6b7280", marginTop: "0.3rem" }}>Upload a PDF · index it · ask questions</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {!reachable && (
              <div style={{ fontSize: "0.7rem", fontWeight: 500, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.20)", borderRadius: 8, padding: "0.35rem 0.75rem" }}>
                ✗ Backend unreachable — check :8000
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "0.42rem 0.9rem" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, boxShadow: isProc ? `0 0 8px ${dotColor}` : "none", animation: isProc ? "pulse 1.4s ease infinite" : "none", flexShrink: 0 }} />
              <span style={{ fontSize: "0.73rem", fontWeight: 600, color: dotColor }}>
                {status.status === "idle" ? "No document" : status.status === "processing" ? "Indexing…" : status.status === "done" ? "Ready" : "Failed"}
              </span>
              {status.status === "done" && (
                <span className="mono" style={{ fontSize: "0.67rem", color: "#374151" }}>· {status.chunks} chunks</span>
              )}
            </div>
            {status.status === "done" && (
              <button className="btn-ghost" onClick={handleReset}>reset DB</button>
            )}
          </div>
        </div>

        {/* UPLOAD + QUERY GRID */}
        <div className="fade-in delay-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

          {/* UPLOAD */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div className="lbl">Upload PDF</div>

            <div
              className={`drop-zone${dragOver ? " drag" : ""}${file ? " filled" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith(".pdf")) { setFile(f); setUploadMsg(null); }
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
                onChange={e => { setFile(e.target.files?.[0] ?? null); setUploadMsg(null); }} />
              {file ? (
                <>
                  <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>📄</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#60a5fa" }}>{file.name}</div>
                  <div className="mono" style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "0.2rem" }}>{(file.size / 1024).toFixed(0)} KB</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "1.6rem", marginBottom: "0.4rem", opacity: 0.15 }}>↑</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4b5563" }}>Click or drag a PDF here</div>
                </>
              )}
            </div>

            <button
              className="btn-primary"
              disabled={!file || uploading || isProc}
              onClick={handleUpload}
            >
              {uploading ? <><Spinner /> Uploading…</> : isProc ? <><Spinner /> Indexing…</> : "Upload & Index PDF"}
            </button>

            {uploadMsg && (
              <div style={{
                fontSize: "0.77rem", fontWeight: 500, lineHeight: 1.55,
                color: uploadMsg.ok ? "#22c55e" : "#f87171",
                background: uploadMsg.ok ? "rgba(34,197,94,0.07)" : "rgba(248,113,113,0.07)",
                border: `1px solid ${uploadMsg.ok ? "rgba(34,197,94,0.20)" : "rgba(248,113,113,0.20)"}`,
                borderRadius: 9, padding: "0.6rem 0.9rem",
              }}>
                {uploadMsg.text}
              </div>
            )}

            <div style={{ paddingTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="lbl" style={{ marginBottom: "0.4rem" }}>Pipeline</div>
              {[
                ["01", "spaCy sentence splitting"],
                ["02", "10-sentence chunk assembly"],
                ["03", "all-mpnet-base-v2 → 768d vectors"],
                ["04", "pgvector HNSW batch insert"],
              ].map(([n, t]) => (
                <div key={n} style={{ display: "flex", gap: "0.7rem", alignItems: "baseline" }}>
                  <span className="mono" style={{ fontSize: "0.6rem", fontWeight: 700, color: "#3b82f6", flexShrink: 0 }}>{n}</span>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QUERY */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div className="lbl">Ask a question</div>

            {/* State hint when not ready */}
            {status.status !== "done" && (
              <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#6b7280", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.8rem 1rem", lineHeight: 1.6 }}>
                {!reachable
                  ? "⚠ Backend not reachable. Add CORS middleware and restart uvicorn."
                  : status.status === "idle"    ? "⬆ Upload and index a PDF first."
                  : status.status === "processing" ? "⏳ Still indexing — wait for status to show Ready."
                  : `✗ ${status.error ?? "Unknown error"}`}
              </div>
            )}

            <textarea
              rows={4}
              value={query}
              disabled={status.status !== "done"}
              placeholder={status.status === "done" ? "Type your question and press Enter or click Ask →" : ""}
              onChange={e => { setQuery(e.target.value); setQueryErr(""); }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuery(); }
              }}
            />

            <button
              className="btn-primary"
              disabled={!query.trim() || querying || status.status !== "done"}
              onClick={handleQuery}
            >
              {querying
                ? <><Spinner /> Generating… {elapsed}s{elapsed > 20 ? " (Mac MPS is slow, hang tight)" : ""}</>
                : "Ask →"}
            </button>

            {/* Generation progress hint */}
            {querying && (
              <div style={{ fontSize: "0.72rem", color: "#f59e0b", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 9, padding: "0.6rem 0.9rem", lineHeight: 1.6 }}>
                <strong>Gemma-2b is generating on your Mac.</strong> This takes 30–90s on MPS/CPU — the answer will appear here when done. Don&apos;t close the tab.
                {elapsed > 60 && <div style={{ marginTop: "0.3rem", color: "#ef4444" }}>Over 60s — if it never responds, lower <code style={{ fontFamily: "JetBrains Mono", fontSize: "0.7rem" }}>max_new_tokens</code> in your backend query call.</div>}
              </div>
            )}

            {queryErr && (
              <div style={{ fontSize: "0.77rem", fontWeight: 500, color: "#f87171", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 9, padding: "0.6rem 0.9rem" }}>
                {queryErr}
              </div>
            )}

            {/* Answer */}
            {answer && (
              <div style={{ background: "#0f0f0f", border: "1px solid rgba(59,130,246,0.22)", borderRadius: 12, padding: "1.1rem", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#3b82f6,transparent)" }} />
                <div className="lbl" style={{ color: "#3b82f6", marginBottom: "0.55rem" }}>Gemma-2b answer</div>
                <div style={{ fontSize: "0.875rem", color: "#e2e8f0", lineHeight: 1.75 }}>{answer}</div>
                <div style={{ marginTop: "0.85rem", paddingTop: "0.7rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.68rem", color: "#374151" }}>
                  You can type another question above and ask again.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SOURCES */}
        {sources.length > 0 && (
          <div className="fade-in">
            <div className="lbl" style={{ marginBottom: "0.75rem" }}>Source chunks retrieved</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "0.65rem" }}>
              {sources.map((s, i) => (
                <div key={i} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.85rem 1rem", transition: "border-color 0.13s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span className="pill" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.22)" }}>
                      SOURCE {i + 1}
                    </span>
                    <span className="pill" style={{ background: "rgba(167,139,250,0.10)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.20)" }}>
                      p.{s.page}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.77rem", color: "#9ca3af", lineHeight: 1.65 }}>{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DB STATUS */}
        <div className="fade-in delay-2 card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div className="lbl" style={{ marginBottom: 0 }}>Vector store</div>
            {status.status === "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.45)" }} />
                <span className="mono" style={{ fontSize: "0.63rem", color: "#22c55e" }}>pgvector · {status.chunks} rows</span>
              </div>
            )}
          </div>

          {status.status !== "done" ? (
            <div style={{ height: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.35rem", background: "#080808", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <div style={{ fontSize: "0.77rem", color: "#1f2937" }}>empty — no vectors stored</div>
              <div className="mono" style={{ fontSize: "0.62rem", color: "#111827" }}>table: document_chunks</div>
            </div>
          ) : sources.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr", gap: "0.7rem", padding: "0 0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "0.3rem" }}>
                {["#", "page", "last retrieved chunk"].map(h => (
                  <div key={h} className="mono" style={{ fontSize: "0.56rem", fontWeight: 700, color: "#1f2937", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {sources.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 44px 1fr", gap: "0.7rem", padding: "0.45rem 0.75rem", borderRadius: 8, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="mono" style={{ fontSize: "0.62rem", fontWeight: 700, color: "#374151", alignSelf: "center" }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ alignSelf: "center" }}>
                    <span className="pill" style={{ background: "rgba(167,139,250,0.09)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.18)", fontSize: "0.55rem" }}>p.{c.page}</span>
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#6b7280", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", alignSelf: "center" }}>{c.text}</div>
                </div>
              ))}
              <div className="mono" style={{ textAlign: "center", paddingTop: "0.5rem", fontSize: "0.6rem", color: "#1f2937" }}>
                {status.chunks} total vectors · showing last query's top-5
              </div>
            </>
          ) : (
            <div style={{ fontSize: "0.77rem", color: "#374151", textAlign: "center", padding: "1.5rem 0" }}>
              {status.chunks} vectors ready · ask a question to see retrieved chunks here
            </div>
          )}
        </div>

        {/* STAT CARDS */}
        {status.status === "done" && (
          <div className="fade-in delay-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.85rem" }}>
            {[
              { val: String(status.chunks), label: "Chunks indexed",    color: "#3b82f6", bg: "rgba(59,130,246,0.08)",   brd: "rgba(59,130,246,0.18)" },
              { val: "768",                 label: "Vector dimensions", color: "#22c55e", bg: "rgba(34,197,94,0.08)",    brd: "rgba(34,197,94,0.18)"  },
              { val: "HNSW",                label: "Index type",        color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  brd: "rgba(167,139,250,0.18)"},
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.brd}`, borderRadius: 12, padding: "1.1rem 1.25rem" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginTop: "0.3rem", color: s.color, opacity: 0.6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: "1rem" }} />
      </main>
    </>
  );
}
