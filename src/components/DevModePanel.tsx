"use client";

import { useState } from "react";
import { ProcessingStatus, PruningStrategy } from "@/lib/api";
import PruningPipeline from "./PruningPipeline";

interface DevModePanelProps {
  processingStatus: ProcessingStatus | null;
  strategy: PruningStrategy;
}

// Collapsible pipeline step
function PipelineStep({
  number,
  title,
  subtitle,
  active,
  done,
  children,
  defaultOpen = false,
}: {
  number: string;
  title: string;
  subtitle: string;
  active?: boolean;
  done?: boolean;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetail = done && children;

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-cream/10 to-transparent pointer-events-none" />

      <div className="flex gap-4">
        {/* Step number */}
        <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold transition-all duration-300 ${
          done ? "bg-moss text-cream"
          : active ? "bg-clay/20 text-clay border border-clay/40"
          : "bg-cream/5 text-cream/20 border border-cream/8"
        }`}>
          {done ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : number}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <button
            onClick={() => hasDetail && setOpen(!open)}
            className={`w-full text-left flex items-center gap-3 mb-0.5 group ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
          >
            <span className={`font-semibold text-sm transition-colors ${done || active ? "text-cream" : "text-cream/25"}`}>
              {title}
            </span>
            {active && <span className="text-mono text-[10px] text-clay status-processing">running</span>}
            {done && <span className="text-mono text-[10px] text-moss-light">done</span>}
            {hasDetail && (
              <span className={`ml-auto text-cream/20 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </span>
            )}
          </button>
          <p className={`text-mono text-xs ${done || active ? "text-cream/35" : "text-cream/12"}`}>
            {subtitle}
          </p>

          {/* Expandable detail */}
          {hasDetail && open && (
            <div className="mt-3 space-y-2 fade-up">
              {children}
            </div>
          )}

          {/* Processing shimmer */}
          {active && (
            <div className="mt-2 h-0.5 bg-cream/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-moss to-clay rounded-full scan-line w-1/3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-mono text-[10px] text-cream/25 w-28 flex-shrink-0">{label}</span>
      <span className="text-mono text-[10px] text-cream/55">{val}</span>
    </div>
  );
}

function DetailBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-cream rounded-lg p-3 border border-cream/6 space-y-1.5">
      {children}
    </div>
  );
}

export default function DevModePanel({ processingStatus, strategy }: DevModePanelProps) {
  const isIdle = !processingStatus || processingStatus.status === "idle";
  const isProcessing = processingStatus?.status === "processing";
  const isDone = processingStatus?.status === "done";
  const isFailed = processingStatus?.status === "failed";
  const isRag = processingStatus?.mode === "rag";
  const isFullCtx = processingStatus?.mode === "full_context";
  const ps = processingStatus?.pruning_summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cream/8">
        <div className="w-2 h-2 rounded-full bg-clay pulse-dot" />
        <h2 className="font-bold text-cream text-sm uppercase tracking-widest">Dev Pipeline</h2>
        <div className="ml-auto">
          <span className={`text-mono text-[10px] px-2 py-1 rounded-full border ${
            isIdle ? "border-cream/10 text-cream/20"
            : isProcessing ? "border-clay/30 text-clay status-processing"
            : isDone ? "border-moss/40 text-moss-light"
            : "border-clay/40 text-clay"
          }`}>
            {isIdle ? "idle" : isProcessing ? "processing" : isDone
              ? (isRag ? "rag" : "full_ctx") : "failed"}
          </span>
        </div>
      </div>

      {/* Pipeline steps */}
      <div>

        {/* 01 — PDF Ingestion */}
        <PipelineStep number="01" title="PDF Ingestion" subtitle="PyMuPDF block extraction per page"
          done={isDone || isProcessing} defaultOpen={false}>
          <DetailBox>
            <InfoRow label="library" val="PyMuPDF (fitz)" />
            <InfoRow label="method" val='page.get_text("blocks") — preserves layout' />
            <InfoRow label="post-proc" val="join blocks with \\n, strip whitespace" />
            <InfoRow label="mode" val={isFullCtx
              ? `full_context — ${processingStatus?.chunks ?? 0} pages in memory (fits ≤${6000} tokens)`
              : "rag — exceeds context window, switched to chunked pipeline"} />
          </DetailBox>
        </PipelineStep>

        {/* 02 — Sentence Chunking */}
        <PipelineStep number="02" title="Sentence Chunking" subtitle="spaCy sentencizer → 10-sentence windows"
          done={isDone && isRag} active={isProcessing} defaultOpen={false}>
          <DetailBox>
            <InfoRow label="tokenizer" val="spaCy English sentencizer" />
            <InfoRow label="window" val="10 sentences per chunk (split_list)" />
            <InfoRow label="overlap" val="none — contiguous windows" />
            <InfoRow label="post-proc" val='strip double spaces · fix ".Cap" splits via regex' />
            {ps && <InfoRow label="output" val={`${ps.total_chunks} raw chunks produced`} />}
          </DetailBox>
          {ps && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "raw chunks", val: ps.total_chunks },
                { label: "avg sentences", val: "~10" },
                { label: "empty filtered", val: "yes" },
              ].map((s) => (
                <div key={s.label} className="glass-cream rounded-lg p-2.5 border border-cream/5 text-center">
                  <p className="text-drama text-xl text-cream/80">{s.val}</p>
                  <p className="text-mono text-[9px] text-cream/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </PipelineStep>

        {/* 03 — Embedding */}
        <PipelineStep number="03" title="Embedding Generation" subtitle="all-mpnet-base-v2 → 768-dim vectors"
          done={isDone && isRag} active={isProcessing} defaultOpen={false}>
          <DetailBox>
            <InfoRow label="model" val="sentence-transformers/all-mpnet-base-v2" />
            <InfoRow label="dimensions" val="768" />
            <InfoRow label="batch size" val="32" />
            <InfoRow label="device" val="mps (Apple Silicon) / cuda / cpu" />
            <InfoRow label="dtype" val="float32 → stored as vector(768) in pgvector" />
            <InfoRow label="normalize" val="L2-normalized by SentenceTransformer" />
          </DetailBox>
          {ps && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "vectors computed", val: ps.total_chunks },
                { label: "dims each", val: 768 },
              ].map((s) => (
                <div key={s.label} className="glass-cream rounded-lg p-2.5 border border-cream/5 text-center">
                  <p className="text-drama text-xl text-cream/80">{s.val}</p>
                  <p className="text-mono text-[9px] text-cream/30 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </PipelineStep>

        {/* 04 — Pruning */}
        <PipelineStep
          number="04"
          title={`Pruning — ${strategy.toUpperCase()}`}
          subtitle="Vector selection before pgvector insertion"
          done={isDone && isRag} active={isProcessing} defaultOpen={false}
        >
          {ps && (
            <>
              <DetailBox>
                <InfoRow label="strategy" val={strategy} />
                <InfoRow label="total in" val={`${ps.total_chunks} chunks`} />
                <InfoRow label="kept" val={`${ps.chunks_kept} (${ps.retention_rate_pct}%)`} />
                <InfoRow label="pruned" val={`${ps.chunks_pruned} (${ps.pruning_rate_pct}%)`} />
                <InfoRow label="vectors saved" val={`${ps.storage_vectors_saved} embeddings not stored`} />
                {strategy === "cosine" && <InfoRow label="method" val="prune chunks > mean×0.85 similarity to centroid" />}
                {strategy === "cosine_whitened" && <InfoRow label="method" val="whitened space → remove anisotropy → cosine prune" />}
                {strategy === "kmeans" && <InfoRow label="method" val={`√n clusters, keep closest to each centroid`} />}
                {strategy === "mmr" && <InfoRow label="method" val="iterative: λ×relevance − (1−λ)×redundancy, λ=0.5" />}
                {strategy === "none" && <InfoRow label="method" val="no pruning — all chunks inserted verbatim" />}
              </DetailBox>
              <div className="glass-cream rounded-lg p-3 border border-cream/6">
                <div className="flex justify-between mb-2">
                  <p className="text-mono text-[10px] text-cream/35">Retention</p>
                  <p className="text-mono text-[10px] text-clay">{ps.pruning_rate_pct}% pruned</p>
                </div>
                <div className="h-2 bg-cream/6 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bar-fill bg-gradient-to-r from-moss to-moss-light"
                    style={{ width: `${ps.retention_rate_pct}%` }} />
                </div>
              </div>
            </>
          )}
        </PipelineStep>

        {/* 05 — pgvector */}
        <PipelineStep number="05" title="pgvector Insertion" subtitle="Surviving embeddings written to PostgreSQL"
          done={isDone && isRag} active={isProcessing} defaultOpen={false}>
          <DetailBox>
            <InfoRow label="extension" val="pgvector (CREATE EXTENSION vector)" />
            <InfoRow label="table" val="document_chunks(id, page_number, content, embedding vector(768))" />
            <InfoRow label="insert" val="execute_values batch INSERT" />
            <InfoRow label="index" val="cosine distance (<=>)" />
            {ps && <InfoRow label="rows written" val={`${ps.chunks_kept} rows`} />}
          </DetailBox>
        </PipelineStep>

        {/* 06 — Retrieval */}
        <PipelineStep number="06" title="Retrieval" subtitle="ANN search + optional MaxSim re-ranking"
          done={false} defaultOpen={false}>
          <DetailBox>
            <InfoRow label="query embed" val="same model (all-mpnet-base-v2)" />
            <InfoRow label="ann fetch" val="top-5 (or top-20 with MaxSim)" />
            <InfoRow label="distance" val="cosine (embedding <=> query)" />
            <InfoRow label="maxsim" val="iterative diversity rerank: rel − 0.5×redundancy" />
          </DetailBox>
        </PipelineStep>

        {/* 07 — LLM Generation */}
        <PipelineStep number="07" title="LLM Generation" subtitle="Context + query → tokenizer → model → answer"
          done={false} defaultOpen={false}>
          <DetailBox>
            <InfoRow label="model" val={process.env.NEXT_PUBLIC_MODEL_ID ?? "see MODEL_ID in .env"} />
            <InfoRow label="prompt" val="chat template via tokenizer.apply_chat_template" />
            <InfoRow label="sampling" val="do_sample=True, repetition_penalty=1.1" />
            <InfoRow label="stop" val="eos_token_id" />
            <InfoRow label="defaults" val="temp=0.7, max_new_tokens=256" />
          </DetailBox>
        </PipelineStep>

      </div>

      {/* Full pruning + embeddings report */}
      {isDone && (
        <div className="border-t border-cream/8 pt-6">
          <PruningPipeline processingDone={isDone} strategy={strategy} />
        </div>
      )}

      {isFailed && (
        <div className="p-4 rounded-xl bg-clay/10 border border-clay/20">
          <p className="text-mono text-xs text-clay">Pipeline failed: {processingStatus?.error}</p>
        </div>
      )}
    </div>
  );
}
