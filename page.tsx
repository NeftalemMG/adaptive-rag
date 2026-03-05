use client";
import { useState } from "react";

const BLOCKS: Array<{ id: string; title: string; color: string; lines: Line[] }> = [
  {
    id: "schema",
    title: "Schema definition",
    color: "#3b82f6",
    lines: [
      { t: "comment", v: "-- enable pgvector extension" },
      { t: "keyword", v: "CREATE EXTENSION IF NOT EXISTS", rest: " vector;" },
      { t: "blank", v: "" },
      { t: "keyword", v: "CREATE TABLE IF NOT EXISTS", rest: " document_chunks (" },
      { t: "field",   v: "  id",          type: "SERIAL PRIMARY KEY", note: "auto-increment row id" },
      { t: "field",   v: "  page_number", type: "INTEGER",            note: "source PDF page" },
      { t: "field",   v: "  content",     type: "TEXT",               note: "10-sentence chunk" },
      { t: "field",   v: "  embedding",   type: "vector(768)",        note: "all-mpnet-base-v2" },
      { t: "plain",   v: ");" },
      { t: "blank", v: "" },
      { t: "comment", v: "-- HNSW index  ·  m=16  ·  ef_construction=64" },
      { t: "keyword", v: "CREATE INDEX ON", rest: " document_chunks" },
      { t: "plain",   v: "  USING hnsw (embedding vector_cosine_ops)" },
      { t: "plain",   v: "  WITH (m = 16, ef_construction = 64);" },
    ],
  },
  {
    id: "query",
    title: "Retrieval query",
    color: "#22c55e",
    lines: [
      { t: "comment", v: "-- cosine similarity search  ·  $1 = query embedding" },
      { t: "keyword", v: "SELECT", rest: " page_number, content," },
      { t: "plain",   v: "       1 - (embedding <=> $1::vector) AS similarity" },
      { t: "keyword", v: "FROM",    rest: "  document_chunks" },
      { t: "keyword", v: "ORDER BY", rest: " embedding <=> $1::vector" },
      { t: "keyword", v: "LIMIT",   rest: "  5;" },
    ],
  },
  {
    id: "inspect",
    title: "Inspection queries",
    color: "#a78bfa",
    lines: [
      { t: "comment", v: "-- row count" },
      { t: "keyword", v: "SELECT", rest: " COUNT(*) FROM document_chunks;" },
      { t: "blank", v: "" },
      { t: "comment", v: "-- table size on disk" },
      { t: "keyword", v: "SELECT", rest: " pg_size_pretty(" },
      { t: "plain",   v: "  pg_total_relation_size('document_chunks'));" },
      { t: "blank", v: "" },
      { t: "comment", v: "-- confirm index exists" },
      { t: "keyword", v: "SELECT", rest: " indexname, indexdef" },
      { t: "keyword", v: "FROM",   rest: "  pg_indexes" },
      { t: "keyword", v: "WHERE",  rest: " tablename = 'document_chunks';" },
    ],
  },
];

type Line = { t: string; v: string; rest?: string; type?: string; note?: string; color?: string };

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 700, padding: "0.22rem 0.65rem",
      borderRadius: 100, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em",
      background: ${color}18, color, border: 1px solid ${color}30,
    }}>{label}</span>
  );
}

function SqlBlock({ title, color, lines, open, onToggle }: {
  title: string; color: string; lines: Line[]; open: boolean; onToggle: () => void;
}) {
  return (
    <div style={{
      background: "#080808",
      border: 1px solid ${open ? color + "28" : "rgba(255,255,255,0.07)"},
      borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s",
    }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "0.78rem 1.1rem",
        background: "transparent", border: "none", cursor: "pointer",
        borderBottom: open ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>{title}</span>
        </div>
        <span style={{ fontSize: "0.62rem", color: "#374151", fontFamily: "'JetBrains Mono',monospace" }}>
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "1rem 1.2rem 1.2rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", lineHeight: 2 }}>
          {lines.map((line, i) => {
            if (line.t === "blank")   return <div key={i} style={{ height: "0.4rem" }} />;
            if (line.t === "comment") return <div key={i} style={{ color: "#2d3748", fontStyle: "italic" }}>{line.v}</div>;
            if (line.t === "field")   return (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "1.5rem" }}>
                <span style={{ color: "#e2e8f0", minWidth: 130 }}>{line.v}</span>
                <span style={{ color, minWidth: 130 }}>{line.type}</span>
                <span style={{ color: "#374151", fontStyle: "italic", fontSize: "0.68rem" }}>{line.note}</span>
              </div>
            );
            if (line.t === "keyword") return (
              <div key={i}>
                <span style={{ color: "#60a5fa" }}>{line.v}</span>
                <span style={{ color: "#d1d5db" }}>{line.rest ?? ""}</span>
              </div>
            );
            return <div key={i} style={{ color: "#d1d5db" }}>{line.v}</div>;
          })}
        </div>
      )}
    </div>
  );
}

export default function SchemaPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({ schema: true, query: false, inspect: false });
  const toggle = (id: string) => setOpen(p => ({ ...p, [id]: !p[id] }));

  return (
    <>
      <style>{`
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fi  { animation: fadeUp 0.35s ease forwards; opacity: 0; }
        .d1  { animation-delay: 0.06s; }
        .d2  { animation-delay: 0.12s; }
        .d3  { animation-delay: 0.18s; }
        .lbl { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.11em; text-transform: uppercase; color: #4b5563; margin-bottom: 0.9rem; }
      `}</style>

      <main style={{ minHeight: "100vh", background: "#000", padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

        {/* Header */}
        <div className="fi" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>DB Schema</h1>
            <p style={{ fontSize: "0.77rem", color: "#6b7280", marginTop: "0.3rem" }}>pgvector · HNSW index · query reference</p>
          </div>
          <div style={{ display: "flex", gap: "0.45rem" }}>
            <Tag label="PostgreSQL 16" color="#3b82f6" />
            <Tag label="pgvector"      color="#22c55e" />
            <Tag label="768-dim"       color="#a78bfa" />
          </div>
        </div>

        {/* Table + HNSW side by side */}
        <div className="fi d1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>

          {/* Table columns */}
          <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "1.3rem" }}>
            <div className="lbl">Table · document_chunks</div>
            {[
              { col: "id",          type: "SERIAL",       note: "primary key",        c: "#6b7280" },
              { col: "page_number", type: "INTEGER",      note: "source PDF page",    c: "#3b82f6" },
              { col: "content",     type: "TEXT",         note: "10-sentence chunk",  c: "#3b82f6" },
              { col: "embedding",   type: "vector(768)",  note: "mpnet embeddings",   c: "#22c55e" },
            ].map((r, i, arr) => (
              <div key={r.col} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
                padding: "0.62rem 0",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>{r.col}</div>
                  <div style={{ fontSize: "0.63rem", color: "#374151", marginTop: 2 }}>{r.note}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: r.c, fontFamily: "'JetBrains Mono',monospace", background: ${r.c}12, padding: "0.18rem 0.55rem", borderRadius: 6 }}>{r.type}</span>
                </div>
              </div>
            ))}
          </div>

          {/* HNSW config */}
          <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "1.3rem" }}>
            <div className="lbl">HNSW Index</div>
            {[
              { label: "Method",          value: "HNSW",              color: "#a78bfa" },
              { label: "Operator class",  value: "vector_cosine_ops", color: "#60a5fa" },
              { label: "m",               value: "16 connections",    color: "#e2e8f0" },
              { label: "ef_construction", value: "64",                color: "#e2e8f0" },
              { label: "Distance metric", value: "cosine  (<=>)",     color: "#f59e0b" },
            ].map((r, i, arr) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.58rem 0",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: "0.76rem", color: "#6b7280" }}>{r.label}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: r.color, fontFamily: "'JetBrains Mono',monospace" }}>{r.value}</span>
              </div>
            ))}
            <div style={{ marginTop: "0.85rem", padding: "0.65rem 0.8rem", background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
              <p style={{ fontSize: "0.68rem", color: "#4b5563", lineHeight: 1.65 }}>
                Builds a proximity graph at insert time. Queries traverse the graph — approximate but orders of magnitude faster than brute-force scan.
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible SQL blocks */}
        <div className="fi d2" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div className="lbl">SQL Reference</div>
          {BLOCKS.map(b => (
            <SqlBlock key={b.id} {...b} open={!!open[b.id]} onToggle={() => toggle(b.id)} />
          ))}
        </div>

        {/* Embed model cards */}
        <div className="fi d3" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
          {[
            { k: "Model",      v: "all-mpnet-base-v2", c: "#60a5fa" },
            { k: "Dimensions", v: "768",               c: "#22c55e" },
            { k: "Max input",  v: "384 tokens",        c: "#e2e8f0" },
            { k: "Similarity", v: "cosine",            c: "#f59e0b" },
          ].map(s => (
            <div key={s.k} style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "0.9rem 1rem" }}>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#374151", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5 }}>{s.k}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ height: "1rem" }} />
      </main>
    </>
  );
}