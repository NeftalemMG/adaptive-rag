"use client";

import { useEffect, useState } from "react";
import { getPruningReport, getStoredChunks, PruningReport, ChunkDetail, StoredChunk } from "@/lib/api";

interface PruningPipelineProps {
  processingDone: boolean;
  strategy: string;
}

// Collapsible section wrapper
function Collapsible({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-cream rounded-xl border border-cream/6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream/3 transition-colors duration-150"
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${open ? "bg-clay" : "bg-cream/20"}`} />
        <span className="font-semibold text-cream/80 text-xs">{title}</span>
        {subtitle && <span className="text-mono text-[10px] text-cream/25 hidden sm:block">{subtitle}</span>}
        {badge && (
          <span className="ml-auto text-mono text-[10px] text-clay bg-clay/10 px-2 py-0.5 rounded-full border border-clay/20 flex-shrink-0">
            {badge}
          </span>
        )}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`${badge ? "ml-2" : "ml-auto"} text-cream/20 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-cream/5 pt-3 fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

// Embedding heat-map (real values)
function EmbeddingViz({ embedding }: { embedding: number[] }) {
  const CELLS = 64;
  const step = Math.max(1, Math.floor(embedding.length / CELLS));
  const sampled = Array.from({ length: CELLS }, (_, i) => embedding[i * step] ?? 0);
  const max = Math.max(...sampled.map(Math.abs), 1e-6);
  const normed = sampled.map((v) => v / max);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-8 gap-0.5 rounded-lg overflow-hidden">
        {normed.map((v, i) => {
          const intensity = Math.abs(v);
          const isPos = v >= 0;
          return (
            <div
              key={i}
              title={`dim[${i * step}] = ${(embedding[i * step] ?? 0).toFixed(5)}`}
              className="aspect-square rounded-sm embedding-cell cursor-help"
              style={{
                animationDelay: `${i * 6}ms`,
                backgroundColor: isPos
                  ? `rgba(46,64,54,${intensity * 0.9 + 0.08})`
                  : `rgba(204,88,51,${intensity * 0.8 + 0.08})`,
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-mono text-[9px] text-cream/20">
          <span className="text-moss-light">■</span> pos &nbsp;
          <span className="text-clay/60">■</span> neg - hover dim for value
        </p>
        <p className="text-mono text-[9px] text-cream/15">64 of 768 sampled</p>
      </div>
    </div>
  );
}

// Vector numbers table
function VectorTable({ embedding }: { embedding: number[] }) {
  const [showAll, setShowAll] = useState(false);
  const preview = showAll ? embedding : embedding.slice(0, 32);

  // L2 norm
  const norm = Math.sqrt(embedding.reduce((s, x) => s + x * x, 0));
  const minV = Math.min(...embedding);
  const maxV = Math.max(...embedding);
  const mean = embedding.reduce((s, x) => s + x, 0) / embedding.length;
  const posCount = embedding.filter((v) => v > 0).length;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: "dims", val: embedding.length },
          { label: "‖v‖₂", val: norm.toFixed(4) },
          { label: "min", val: minV.toFixed(4) },
          { label: "max", val: maxV.toFixed(4) },
          { label: "+dims", val: `${posCount}/${embedding.length}` },
        ].map((s) => (
          <div key={s.label} className="bg-charcoal/40 rounded-lg p-1.5 text-center border border-cream/5">
            <p className="text-mono text-[9px] text-cream/25">{s.label}</p>
            <p className="text-mono text-[10px] text-cream/65 font-medium mt-0.5">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Mean note */}
      <p className="text-mono text-[9px] text-cream/20">
        mean={mean.toFixed(5)} — L2-normalised by SentenceTransformer
      </p>

      {/* Dimension table */}
      <div className="bg-charcoal/50 rounded-lg overflow-hidden border border-cream/5">
        <div className="grid grid-cols-4 gap-0 border-b border-cream/5 px-3 py-1.5">
          {["dim", "value", "dim", "value"].map((h, i) => (
            <span key={i} className="text-mono text-[9px] text-cream/25">{h}</span>
          ))}
        </div>
        <div className="max-h-40 overflow-y-auto px-3 py-1.5 space-y-0.5">
          {Array.from({ length: Math.ceil(preview.length / 2) }, (_, row) => {
            const i1 = row * 2;
            const i2 = row * 2 + 1;
            return (
              <div key={row} className="grid grid-cols-4 gap-0">
                <span className="text-mono text-[9px] text-cream/20">{i1}</span>
                <span className={`text-mono text-[9px] font-medium ${(preview[i1] ?? 0) >= 0 ? "text-moss-light" : "text-clay/70"}`}>
                  {(preview[i1] ?? 0).toFixed(5)}
                </span>
                {i2 < preview.length ? (
                  <>
                    <span className="text-mono text-[9px] text-cream/20">{i2}</span>
                    <span className={`text-mono text-[9px] font-medium ${(preview[i2] ?? 0) >= 0 ? "text-moss-light" : "text-clay/70"}`}>
                      {(preview[i2] ?? 0).toFixed(5)}
                    </span>
                  </>
                ) : <><span /><span /></>}
              </div>
            );
          })}
        </div>
        <div className="border-t border-cream/5 px-3 py-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-mono text-[10px] text-cream/30 hover:text-cream/60 transition-colors duration-150"
          >
            {showAll ? `▲ show first 32 of ${embedding.length}` : `▼ show all ${embedding.length} dims`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Score bar
function ScoreBar({ score, kept }: { score: number; kept: boolean }) {
  const pct = Math.min(100, Math.abs(score) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-cream/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bar-fill ${kept ? "bg-moss" : "bg-clay/60"}`}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-mono text-[10px] text-cream/30 w-10 text-right">{score.toFixed(3)}</span>
      <span className={`text-mono text-[10px] w-12 text-right ${kept ? "text-moss-light" : "text-clay/60"}`}>
        {kept ? "kept" : "pruned"}
      </span>
    </div>
  );
}

// Chunk card with collapsible vector section
function ChunkCard({
  chunk,
  storedChunk,
  index,
}: {
  chunk: ChunkDetail;
  storedChunk?: StoredChunk;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`chunk-card-enter rounded-xl border transition-all duration-200 overflow-hidden ${
        chunk.kept
          ? "border-moss/25 bg-moss/5"
          : "border-cream/5 bg-cream/2 opacity-55"
      }`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      {/* Header row — always visible, click to toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-cream/3 transition-colors duration-150"
      >
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${chunk.kept ? "bg-moss pulse-dot" : "bg-clay/35"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-mono text-[10px] text-cream/30">chunk_{chunk.index.toString().padStart(3, "0")}</span>
            <span className="text-mono text-[10px] text-cream/20">p.{chunk.page_number}</span>
            <span className="text-mono text-[10px] text-cream/20 ml-auto">σ={chunk.score.toFixed(5)}</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`text-cream/15 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-90" : ""}`}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
          <p className={`text-xs leading-relaxed ${open ? "text-cream/70" : "text-cream/45 line-clamp-1"}`}>
            {chunk.content_preview}
          </p>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-cream/5 px-3 pb-3 pt-3 space-y-4 fade-up">
          {/* Full text */}
          <div>
            <p className="text-mono text-[9px] text-cream/25 uppercase tracking-wider mb-1.5">Content</p>
            <p className="text-cream/65 text-xs leading-relaxed">{chunk.content_preview}</p>
          </div>

          {/* Score info */}
          <div>
            <p className="text-mono text-[9px] text-cream/25 uppercase tracking-wider mb-1.5">Pruning Score</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "score", val: chunk.score.toFixed(6) },
                { label: "status", val: chunk.kept ? "kept" : "pruned" },
                { label: "page", val: `p.${chunk.page_number}` },
              ].map((s) => (
                <div key={s.label} className="bg-charcoal/40 rounded-lg p-2 text-center border border-cream/5">
                  <p className="text-mono text-[9px] text-cream/25">{s.label}</p>
                  <p className={`text-mono text-[10px] font-medium mt-0.5 ${
                    s.label === "status" ? (chunk.kept ? "text-moss-light" : "text-clay/70") : "text-cream/60"
                  }`}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Embedding vector — only for kept chunks that have a stored vector */}
          {chunk.kept && storedChunk && storedChunk.embedding.length > 0 && (
            <Collapsible
              title="Embedding Vector"
              subtitle="768-dim float32 representation"
              badge={`768d`}
              defaultOpen={false}
            >
              <div className="space-y-3">
                <EmbeddingViz embedding={storedChunk.embedding} />
                <VectorTable embedding={storedChunk.embedding} />
              </div>
            </Collapsible>
          )}

          {/* Pruned — explain why */}
          {chunk.pruned && (
            <div className="glass-cream rounded-lg p-3 border border-clay/15">
              <p className="text-mono text-[10px] text-clay/70">
                Not stored in pgvector — pruned before insertion.
                Score {chunk.score.toFixed(4)} exceeded the strategy threshold.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main component
export default function PruningPipeline({ processingDone, strategy }: PruningPipelineProps) {
  const [report, setReport] = useState<PruningReport | null>(null);
  const [storedChunks, setStoredChunks] = useState<StoredChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chunks" | "embeddings">("overview");

  useEffect(() => {
    if (!processingDone) { setReport(null); setStoredChunks([]); return; }
    setLoading(true);
    setError(null);
    Promise.all([getPruningReport(), getStoredChunks(20)])
      .then(([r, c]) => { setReport(r); setStoredChunks(c.chunks); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [processingDone]);

  if (!processingDone) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-10 h-10 rounded-full border border-cream/10 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cream/15">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p className="text-mono text-xs text-cream/20">Process a document to see the report</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-7 h-7 border-2 border-moss border-t-clay rounded-full animate-spin" />
        <p className="text-mono text-xs text-cream/25">Fetching pipeline data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-clay/10 border border-clay/20">
        <p className="text-mono text-xs text-clay">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  const { summary, score_stats, per_chunk_detail, threshold, strategy_metadata } = report;

  // Build a map from page+content to stored chunk for matching pruning report ↔ stored vectors
  const chunkMap = new Map<string, StoredChunk>();
  storedChunks.forEach((sc) => {
    chunkMap.set(`${sc.page_number}:${sc.content.slice(0, 60)}`, sc);
  });

  return (
    <div className="space-y-5 fade-up">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div>
          <h3 className="font-bold text-cream text-sm">Pruning Report</h3>
          <p className="text-mono text-xs text-cream/30 mt-0.5">click any section to expand</p>
        </div>
        <div className="ml-auto flex gap-1">
          {(["overview", "chunks", "embeddings"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-mono text-xs transition-all duration-150 ${
                activeTab === tab ? "bg-clay/20 text-clay border border-clay/30" : "text-cream/25 hover:text-cream/55"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy badge */}
      <div className="flex items-center gap-3 px-4 py-3 glass-cream rounded-xl border border-cream/6">
        <div className="w-7 h-7 rounded-lg bg-moss/25 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-moss-light">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <p className="text-mono text-xs text-clay uppercase tracking-widest">{report.strategy}</p>
          <p className="text-cream/50 text-[10px] mt-0.5">
            {{
              none: "No pruning - all chunks stored verbatim",
              cosine: "Cosine similarity vs global centroid - prune near-average chunks",
              cosine_whitened: "Whitened embedding space - corrects anisotropy before cosine pruning",
              kmeans: "K-Means clustering - keep one representative per cluster",
              mmr: "Maximal Marginal Relevance - balance relevance and diversity iteratively",
            }[report.strategy] ?? report.strategy}
          </p>
        </div>
      </div>

      {/* ── TAB: Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", val: summary.total_chunks, color: "text-cream/80" },
              { label: "Kept", val: summary.chunks_kept, color: "text-moss-light" },
              { label: "Pruned", val: summary.chunks_pruned, color: "text-clay" },
              { label: "Retention", val: `${summary.retention_rate_pct}%`, color: "text-cream/60" },
            ].map((item) => (
              <div key={item.label} className="glass-cream rounded-xl p-3 border border-cream/5 text-center">
                <p className={`text-drama text-2xl font-light ${item.color}`}>{item.val}</p>
                <p className="text-mono text-[9px] text-cream/30 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Retention bar */}
          <Collapsible title="Vector Budget" subtitle={`${summary.retention_rate_pct}% stored, ${summary.pruning_rate_pct}% saved`}
            badge={`${summary.storage_vectors_saved} saved`} defaultOpen={true}>
            <div className="space-y-2">
              <div className="h-3 bg-cream/6 rounded-full overflow-hidden">
                <div className="h-full rounded-full bar-fill bg-gradient-to-r from-moss to-moss-light"
                  style={{ width: `${summary.retention_rate_pct}%` }} />
              </div>
              <div className="flex justify-between text-mono text-[9px] text-cream/20">
                <span>0</span>
                <span className="text-cream/40">{summary.chunks_kept} kept</span>
                <span>{summary.total_chunks} total</span>
              </div>
            </div>
          </Collapsible>

          {/* Score stats */}
          <Collapsible title="Score Distribution" subtitle="pruning scores across all chunks" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "min", val: score_stats.min.toFixed(6) },
                { label: "max", val: score_stats.max.toFixed(6) },
                { label: "mean", val: score_stats.mean.toFixed(6) },
                { label: "std", val: score_stats.std.toFixed(6) },
              ].map((s) => (
                <div key={s.label} className="bg-charcoal/40 rounded-lg p-2.5 border border-cream/5">
                  <p className="text-mono text-[9px] text-cream/25">{s.label}</p>
                  <p className="text-mono text-xs text-cream/70 font-medium mt-1">{s.val}</p>
                </div>
              ))}
            </div>
          </Collapsible>

          {/* Threshold */}
          <Collapsible title="Decision Threshold" subtitle={`value: ${threshold.value.toFixed(6)}`} defaultOpen={false}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-px bg-clay" />
                <p className="text-mono text-[10px] text-clay">{threshold.value.toFixed(6)}</p>
              </div>
              <p className="text-mono text-[10px] text-cream/35">{threshold.description}</p>
            </div>
          </Collapsible>

          {/* Strategy metadata */}
          {Object.keys(strategy_metadata).length > 0 && (
            <Collapsible title="Strategy Parameters" defaultOpen={false}>
              <div className="space-y-1.5">
                {Object.entries(strategy_metadata).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3">
                    <span className="text-mono text-[10px] text-cream/25 w-32 flex-shrink-0">{k}</span>
                    <span className="text-mono text-[10px] text-cream/55">{String(v)}</span>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </div>
      )}

      {/* ── TAB: Chunks ── */}
      {activeTab === "chunks" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-mono text-xs text-cream/25">{per_chunk_detail.length} chunks — click any to expand</p>
            <div className="ml-auto flex items-center gap-3 text-mono text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-moss inline-block" /><span className="text-cream/35">kept</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-clay/40 inline-block" /><span className="text-cream/35">pruned</span>
              </span>
            </div>
          </div>

          {/* Score bars overview */}
          <Collapsible title="Score Overview" subtitle="all chunks ranked by pruning score" defaultOpen={false}>
            <div className="space-y-1">
              {per_chunk_detail.map((chunk, i) => (
                <ScoreBar key={i} score={chunk.score} kept={chunk.kept} />
              ))}
            </div>
          </Collapsible>

          {/* Chunk cards */}
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-0.5">
            {per_chunk_detail.map((chunk, i) => {
              // Try to match this pruning-report chunk to a stored chunk by page + content prefix
              const key = `${chunk.page_number}:${chunk.content_preview.slice(0, 60)}`;
              const stored = chunkMap.get(key);
              return (
                <ChunkCard key={chunk.index} chunk={chunk} storedChunk={stored} index={i} />
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Embeddings ── */}
      {activeTab === "embeddings" && (
        <div className="space-y-3">
          <p className="text-mono text-xs text-cream/25">
            Real 768-dim vectors from pgvector. Each tile = one sampled dimension.
          </p>

          {storedChunks.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-mono text-xs text-cream/20">No stored chunks — full_context mode has no vectors</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-0.5">
              {storedChunks.map((chunk, i) => (
                <Collapsible
                  key={chunk.id}
                  title={`chunk id=${chunk.id} — p.${chunk.page_number}`}
                  subtitle={chunk.content.slice(0, 55) + "…"}
                  badge="768d"
                  defaultOpen={false}
                >
                  <div className="space-y-4">
                    <p className="text-cream/55 text-xs leading-relaxed">{chunk.content}</p>
                    <EmbeddingViz embedding={chunk.embedding} />
                    <VectorTable embedding={chunk.embedding} />
                  </div>
                </Collapsible>
              ))}
              {storedChunks.length === 20 && (
                <p className="text-mono text-[10px] text-cream/15 text-center py-2">
                  showing first 20 — edit /chunks?limit=N in api.ts to load more
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
