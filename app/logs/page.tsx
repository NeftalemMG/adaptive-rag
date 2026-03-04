"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : "http://localhost:8000";

interface StatusRes { status: string; chunks: number; error: string | null }

function useStatus(ms = 1500) {

  const [s, setS] = useState<StatusRes>({ 
    
    status: "idle", 
    chunks: 0, 
    error: null 

  });
  const poll = useCallback(async () => {
    try { const r = await fetch(`${API}/status`); if (r.ok) setS(await r.json()); } catch {}
  }, []);
  useEffect(() => { poll(); const t = setInterval(poll, ms); return () => clearInterval(t); }, [poll, ms]);
  return s;

}

interface LogEntry { 
    ts: string; 
    level: "INFO" | "WARN" | "ERROR" | "OK"; 
    msg: string 
}

const STATUS_COLOR: Record<string, string> = {

  idle: "#4b5563", processing: "#f59e0b", done: "#22c55e", failed: "#f87171"

};

export default function LogsPage() {

  const status = useStatus();
  const [log, setLog]   = useState<LogEntry[]>([]);
  const [prevStatus, setPrevStatus] = useState("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Synthesize log entries from status transitions
  useEffect(() => {
    const now = () => new Date().toLocaleTimeString("en-US", { hour12: false });
    if (status.status !== prevStatus) {
      if (status.status === "processing") {

        setLog(prev => [...prev,
          { ts: now(), level: "INFO", msg: "Upload received — starting PDF ingestion pipeline" },
          { ts: now(), level: "INFO", msg: "Extracting text with PyMuPDF (fitz)…" },
          { ts: now(), level: "INFO", msg: "Splitting sentences with spaCy English sentencizer…" },
        ]);

      }

      if (status.status === "done") {

        setLog(prev => [...prev,
          { ts: now(), level: "INFO", msg: "Encoding chunks with all-mpnet-base-v2 (768-dim)…" },
          { ts: now(), level: "OK",   msg: `Inserted ${status.chunks} chunk vectors into pgvector` },
          { ts: now(), level: "OK",   msg: `HNSW index updated — ${status.chunks} rows in document_chunks` },
          { ts: now(), level: "INFO", msg: "Status → done. Ready to query." },
        ]);

      }

      if (status.status === "failed") {

        setLog(prev => [...prev,
          { ts: now(), level: "ERROR", msg: `Pipeline failed: ${status.error ?? "unknown error"}` },
        ]);

      }

      if (status.status === "idle" && prevStatus !== "idle") {

        setLog(prev => [...prev,
          { ts: now(), level: "INFO", msg: "Database reset — document_chunks cleared." },
        ]);
      }
      setPrevStatus(status.status);
    }
  }, [status.status, status.chunks, status.error, prevStatus]);

  // Add initial entry
  useEffect(() => {
    setLog([{ ts: new Date().toLocaleTimeString("en-US", { hour12: false }), level: "INFO", msg: "Log viewer connected. Polling /status every 1.5s." }]);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const LEVEL_COLOR: Record<string, string> = {
    INFO: "#3b82f6", WARN: "#f59e0b", ERROR: "#f87171", OK: "#22c55e"
  };

  return (
    <>
      <style>{`* { font-family: 'Inter', sans-serif; } .mono { font-family: 'JetBrains Mono', monospace !important; }`}</style>
      <main style={{ minHeight: "100vh", background: "#000", padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div className="fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>Processing Log</h1>
            <p style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.3rem" }}>Live ingestion feed · polling /status every 1.5s</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "0.45rem 0.9rem" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status.status], animation: status.status === "processing" ? "pulse 1.4s infinite" : "none", boxShadow: status.status === "processing" ? `0 0 8px ${STATUS_COLOR[status.status]}` : "none" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: STATUS_COLOR[status.status] }}>{status.status}</span>
            {status.status === "done" && <span style={{ fontSize: "0.7rem", color: "#374151", fontFamily: "'JetBrains Mono',monospace" }}>· {status.chunks.toLocaleString()} chunks</span>}
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="fade-in delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.6rem" }}>
          {[
            { label: "Upload",   done: ["processing","done"].includes(status.status), active: false },
            { label: "Extract",  done: ["processing","done"].includes(status.status), active: status.status === "processing" },
            { label: "Chunk",    done: status.status === "done", active: status.status === "processing" },
            { label: "Embed",    done: status.status === "done", active: status.status === "processing" },
            { label: "Index",    done: status.status === "done", active: false },
          ].map((s, i) => (
            <div key={s.label} style={{
              background: s.done ? "rgba(34,197,94,0.08)" : s.active ? "rgba(245,158,11,0.08)" : "#0c0c0c",
              border: `1px solid ${s.done ? "rgba(34,197,94,0.22)" : s.active ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 10, padding: "0.75rem 1rem", textAlign: "center",
            }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#374151", fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>0{i+1}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: s.done ? "#22c55e" : s.active ? "#f59e0b" : "#4b5563" }}>{s.label}</div>
              <div style={{ fontSize: "0.6rem", fontFamily: "'JetBrains Mono',monospace", color: s.done ? "#22c55e" : s.active ? "#f59e0b" : "#1f2937", marginTop: 3 }}>
                {s.done ? "done" : s.active ? "running" : "waiting"}
              </div>
            </div>
          ))}
        </div>

        {/* Log terminal */}
        <div className="fade-in delay-2" style={{
          background: "#080808",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          overflow: "hidden",
          flex: 1,
        }}>
          {/* Terminal bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.7rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0c" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", opacity: 0.7 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />
            <span style={{ fontSize: "0.65rem", color: "#374151", marginLeft: "0.5rem", fontFamily: "'JetBrains Mono',monospace" }}>adaptive-rag — pipeline log</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "0.6rem", color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" }}>live</span>
            </div>
          </div>
          {/* Log lines */}
          <div style={{ padding: "1rem", maxHeight: "50vh", overflowY: "auto", fontFamily: "'JetBrains Mono',monospace" }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "0.45rem", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.65rem", color: "#1f2937", flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: LEVEL_COLOR[entry.level], flexShrink: 0, width: 38 }}>{entry.level}</span>
                <span style={{ fontSize: "0.72rem", color: entry.level === "ERROR" ? "#f87171" : entry.level === "OK" ? "#22c55e" : "#9ca3af", lineHeight: 1.5 }}>{entry.msg}</span>
              </div>
            ))}
            {status.status === "processing" && (
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.65rem", color: "#1f2937" }}>—</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#f59e0b" }}>WAIT</span>
                <span style={{ fontSize: "0.72rem", color: "#f59e0b" }}>Processing in background<span style={{ animation: "blink 1s infinite" }}>_</span></span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

      </main>
    </>
  );
}
