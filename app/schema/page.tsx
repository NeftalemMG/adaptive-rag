"use client";

const SQL_SCHEMA = `-- PostgreSQL 16 + pgvector 0.8.x
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id           SERIAL PRIMARY KEY,
    page_number  INTEGER,
    content      TEXT,
    embedding    vector(768)
);

-- HNSW approximate nearest-neighbor index
-- m=16: connections per node (higher → better recall, more RAM)
-- ef_construction=64: build-time search width
CREATE INDEX ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);`;

const QUERY_SQL = `-- MaxSim cosine similarity retrieval
SELECT page_number, content,
       1 - (embedding <=> $1::vector) AS similarity
FROM   document_chunks
ORDER  BY embedding <=> $1::vector   -- <=> = cosine distance
LIMIT  5;`;

const INSPECT_SQL = `-- Useful inspection queries
SELECT COUNT(*)                   FROM document_chunks;
SELECT MIN(page_number), MAX(page_number) FROM document_chunks;
SELECT pg_size_pretty(pg_total_relation_size('document_chunks'));

-- Check index
SELECT indexname, indexdef
FROM   pg_indexes
WHERE  tablename = 'document_chunks';`;

function CodeBlock({ code, title, color = "#3b82f6" }: { code: string; title: string; color?: string }) {
  return (
    <div style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0c" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em" }}>{title}</span>
        <span style={{ fontSize: "0.6rem", color: "#374151", fontFamily: "'JetBrains Mono',monospace" }}>SQL</span>
      </div>
      <pre style={{ padding: "1.1rem 1.25rem", margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.76rem", color: "#9ca3af", lineHeight: 1.8, overflowX: "auto", whiteSpace: "pre" }}>
        {code.split("\n").map((line, i) => {
          const isComment = line.trim().startsWith("--");
          const isKeyword = /^(CREATE|SELECT|FROM|WHERE|ORDER|LIMIT|WITH|USING|INSERT|DELETE|UPDATE|TABLE|INDEX|ON|IF)\b/.test(line.trim());
          return (
            <div key={i} style={{ color: isComment ? "#374151" : isKeyword ? "#60a5fa" : "#d1d5db" }}>
              {line || " "}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function InfoRow({ label, value, color = "#9ca3af" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: "0.78rem", fontWeight: 600, color, fontFamily: "'JetBrains Mono',monospace" }}>{value}</span>
    </div>
  );
}

export default function SchemaPage() {
  return (
    <>
      <style>{`* { font-family: 'Inter', sans-serif; }`}</style>
      <main style={{ minHeight: "100vh", background: "#000", padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div className="fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>DB Schema</h1>
            <p style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.3rem" }}>pgvector table · HNSW index · query reference</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[["PostgreSQL 16", "#3b82f6"], ["pgvector 0.8.x", "#22c55e"], ["768-dim", "#a78bfa"]].map(([l, c]) => (
              <span key={l} style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.3rem 0.7rem", borderRadius: 100, background: `${c}18`, color: c, border: `1px solid ${c}30`, fontFamily: "'JetBrains Mono',monospace" }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Table spec + index spec side by side */}
        <div className="fade-in delay-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

          {/* Table columns */}
          <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.4rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "1rem" }}>Table · document_chunks</div>
            {[
              { col: "id",           type: "SERIAL",      note: "auto-increment primary key" },
              { col: "page_number",  type: "INTEGER",     note: "source PDF page" },
              { col: "content",      type: "TEXT",        note: "10-sentence chunk text" },
              { col: "embedding",    type: "vector(768)", note: "all-mpnet-base-v2 output" },
            ].map(r => (
              <div key={r.col} style={{ display: "grid", gridTemplateColumns: "130px 110px 1fr", gap: "0.5rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>{r.col}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#3b82f6", fontFamily: "'JetBrains Mono',monospace" }}>{r.type}</span>
                <span style={{ fontSize: "0.7rem", color: "#4b5563" }}>{r.note}</span>
              </div>
            ))}
          </div>

          {/* HNSW index config */}
          <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.4rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "1rem" }}>HNSW Index Config</div>
            <InfoRow label="Index method"       value="HNSW"                  color="#a78bfa" />
            <InfoRow label="Distance operator"  value="vector_cosine_ops"      color="#60a5fa" />
            <InfoRow label="m (connections)"    value="16"                     color="#e2e8f0" />
            <InfoRow label="ef_construction"    value="64"                     color="#e2e8f0" />
            <InfoRow label="Dimensions"         value="768"                    color="#22c55e" />
            <InfoRow label="Distance metric"    value="cosine (<=>)"           color="#f59e0b" />
            <div style={{ marginTop: "0.75rem", padding: "0.7rem 0.85rem", background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9 }}>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", lineHeight: 1.6 }}>
                HNSW builds a multi-layer proximity graph at insert time. Queries do approximate graph traversal — much faster than exact brute-force (<code style={{ fontFamily: "'JetBrains Mono',monospace", color: "#9ca3af" }}>O(k·log n)</code> vs <code style={{ fontFamily: "'JetBrains Mono',monospace", color: "#9ca3af" }}>O(n)</code>).
              </div>
            </div>
          </div>
        </div>

        {/* SQL blocks */}
        <div className="fade-in delay-2" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <CodeBlock title="SCHEMA DEFINITION" code={SQL_SCHEMA} color="#3b82f6" />
          <CodeBlock title="RETRIEVAL QUERY — /query endpoint" code={QUERY_SQL} color="#22c55e" />
          <CodeBlock title="INSPECTION QUERIES" code={INSPECT_SQL} color="#a78bfa" />
        </div>

        {/* Embed model reference */}
        <div className="fade-in delay-3" style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.4rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "1rem" }}>Embedding Model Reference</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
            {[
              { k: "Model",       v: "all-mpnet-base-v2",      c: "#60a5fa" },
              { k: "Dimensions",  v: "768",                    c: "#22c55e" },
              { k: "Max tokens",  v: "384 tokens",             c: "#e2e8f0" },
              { k: "Similarity",  v: "cosine distance",        c: "#f59e0b" },
            ].map(s => (
              <div key={s.k} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem 1rem" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#374151", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{s.k}</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: "1rem" }} />
      </main>
    </>
  );
}
