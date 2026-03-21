"use client";

import { useState, useEffect } from "react";
import { ProcessingStatus, PruningStrategy, resetData } from "@/lib/api";
import UploadPanel from "@/components/UploadPanel";
import QueryPanel from "@/components/QueryPanel";
import DevModePanel from "@/components/DevModePanel";

function NavBar({ devMode, onToggleDev }: { devMode: boolean; onToggleDev: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
      scrolled
        ? "bg-charcoal/85 backdrop-blur-xl border border-cream/10 shadow-2xl"
        : "bg-transparent border border-transparent"
    } rounded-full px-5 py-2.5 flex items-center gap-5`}>

      {/* Leaf logo */}
      <div className="flex items-center gap-2.5">
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 28 C4 28 6 14 16 8 C26 2 30 4 30 4 C30 4 28 14 20 20 C14 24.5 8 26 4 28Z"
            fill="#2E4036" stroke="#3d5549" strokeWidth="1"
          />
          <path d="M4 28 C8 22 13 17 20 12" stroke="#CC5833" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
          <path d="M4 28 C6 24 10 20 16 16" stroke="#CC5833" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
        </svg>
        <span className="font-bold text-cream text-sm tracking-tight">Adaptive</span>
        <span className="text-cream/20 text-mono text-xs">/rag</span>
      </div>

      {/* Dev mode toggle — bold and obvious */}
      <button
        onClick={onToggleDev}
        className={`ml-1 flex items-center gap-2 px-4 py-1.5 rounded-full text-mono text-xs font-medium transition-all duration-300 border ${
          devMode
            ? "bg-clay text-cream border-clay shadow-lg shadow-clay/30"
            : "border-cream/15 text-cream/40 hover:border-cream/40 hover:text-cream/80 hover:bg-cream/5"
        }`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        dev mode
        {devMode && <div className="w-1.5 h-1.5 rounded-full bg-cream pulse-dot" />}
      </button>
    </nav>
  );
}

function HeroSection() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1600&q=80')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/65 to-moss-dark/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/20 to-transparent" />
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(242,240,233,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(242,240,233,0.025) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />

      {/* Top badges */}
      <div className="relative z-10 pt-32 px-8 sm:px-14 flex items-start justify-between">
        <div className="flex flex-col gap-3 fade-up fade-up-delay-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cream/10 bg-charcoal/30 backdrop-blur-sm w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-moss-light pulse-dot" />
            <span className="text-mono text-[10px] text-cream/50">all-mpnet-base-v2 · 768d · pgvector</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-clay/20 bg-clay/8 backdrop-blur-sm w-fit">
            <span className="text-mono text-[10px] text-clay/80">5 pruning strategies</span>
          </div>
        </div>

        {/* Right: strategy index */}
        <div className="hidden lg:flex flex-col gap-4 items-end fade-up fade-up-delay-2">
          {[
            { label: "cosine", desc: "centroid distance" },
            { label: "cosine_whitened", desc: "decorrelated space" },
            { label: "k-means", desc: "cluster reps" },
            { label: "mmr", desc: "coverage × diversity" },
            { label: "none", desc: "store all" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-3" style={{ opacity: 0.15 + i * 0.06 }}>
              <span className="text-mono text-[10px] text-cream/60">{s.desc}</span>
              <div className="w-px h-3 bg-cream/20" />
              <span className="text-mono text-[10px] text-clay/70">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center headline */}
      <div className="relative z-10 flex-1 flex items-center px-8 sm:px-14">
        <div className="max-w-3xl space-y-6">
          <p className="text-mono text-xs text-clay/90 uppercase tracking-[0.35em] fade-up fade-up-delay-1">
            Adaptive Vector Retrieval
          </p>
          <div className="fade-up fade-up-delay-2">
            <h1 className="font-bold text-cream text-4xl sm:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
              Ask anything.
            </h1>
            <h1 className="text-drama text-cream/85 text-4xl sm:text-6xl lg:text-[5.5rem] leading-[1.05] font-light mt-1">
              The document answers.
            </h1>
          </div>
          <p className="text-cream/45 text-sm sm:text-base max-w-md leading-relaxed fade-up fade-up-delay-3">
            Upload a research paper, report, or manual. Choose how your vectors
            get pruned. Get back precise answers with page-level attribution.
          </p>
          <div className="fade-up fade-up-delay-4">
            <a href="#interface"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-clay hover:bg-clay-light text-cream text-sm font-semibold tracking-wide transition-all duration-200 glow-clay"
            >
              Open interface
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom pipeline ticker */}
      <div className="relative z-10 pb-10 px-8 sm:px-14 fade-up fade-up-delay-4">
        <div className="flex items-center gap-0 overflow-hidden">
          {[
            "01 · PDF Ingestion",
            "02 · Sentence Chunking",
            "03 · Embedding (768d)",
            "04 · Vector Pruning",
            "05 · pgvector Store",
            "06 · ANN Retrieval",
            "07 · LLM Generation",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-0 flex-shrink-0">
              <span className="text-mono text-[10px] text-cream/20 whitespace-nowrap px-3"
                style={{ opacity: 0.1 + (i % 3) * 0.08 }}>
                {step}
              </span>
              {i < 6 && <div className="w-px h-3 bg-cream/10" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureRow() {
  return (
    <div className="px-6 sm:px-12 py-16 border-t border-cream/5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            ),
            title: "Adaptive Pruning",
            desc: "Five strategies from cosine to MMR - each with a different retention philosophy.",
          },
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            ),
            title: "Dual Retrieval Mode",
            desc: "Full context for short docs. pgvector ANN + optional MaxSim for long ones.",
          },
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            ),
            title: "Pipeline Inspector",
            desc: "Dev mode exposes every step - embeddings, scores, thresholds, and pruning decisions.",
          },
        ].map((f) => (
          <div key={f.title} className="glass-cream rounded-2xl p-5 border border-cream/6 hover:border-cream/15 transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-moss/20 flex items-center justify-center text-moss-light mb-4">
              {f.icon}
            </div>
            <p className="font-semibold text-cream text-sm mb-1.5">{f.title}</p>
            <p className="text-cream/45 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [devMode, setDevMode] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [strategy, setStrategy] = useState<PruningStrategy>("none");
  const [resetKey, setResetKey] = useState(0);

  const handleProcessingComplete = (status: ProcessingStatus) => {
    setProcessingStatus(status);
    setIsReady(status.status === "done");
  };

  const handleProcessingStart = () => {
    setIsReady(false);
    setProcessingStatus({ status: "processing", chunks: 0, error: null, mode: null });
  };

  const handleStrategyChange = async (s: PruningStrategy) => {
    if (s !== strategy) {
      try { await resetData(); } catch { /* ignore */ }
      setStrategy(s);
      setIsReady(false);
      setProcessingStatus(null);
      setResetKey((k) => k + 1);
    }
  };

  const handleReset = async () => {
    try { await resetData(); } catch { /* ignore */ }
    setIsReady(false);
    setProcessingStatus(null);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="reveal-page bg-charcoal min-h-screen">
      <NavBar devMode={devMode} onToggleDev={() => setDevMode(!devMode)} />
      <HeroSection />
      <FeatureRow />

      <section id="interface" className="px-4 sm:px-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-mono text-xs text-clay/70 uppercase tracking-widest mb-2">Interface</p>
              <h2 className="font-bold text-cream text-2xl">
                {devMode
                  ? <>Pipeline <span className="text-drama italic font-light text-cream/60">inspector</span></>
                  : <>Document <span className="text-drama italic font-light text-cream/60">intelligence</span></>
                }
              </h2>
            </div>
            {isReady && (
              <button onClick={handleReset}
                className="flex items-center gap-2 text-mono text-xs text-cream/30 hover:text-cream/60 transition-colors duration-150">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.09"/>
                </svg>
                reset
              </button>
            )}
          </div>

          <div className={`grid gap-6 ${devMode ? "lg:grid-cols-[1fr,1.4fr]" : "max-w-xl mx-auto"}`}>
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border border-cream/8">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-clay" />
                  <h3 className="text-mono text-xs text-cream/50 uppercase tracking-widest">Upload</h3>
                </div>
                <UploadPanel
                  key={resetKey}
                  onProcessingComplete={handleProcessingComplete}
                  onProcessingStart={handleProcessingStart}
                  devMode={devMode}
                  selectedStrategy={strategy}
                  onStrategyChange={handleStrategyChange}
                />
              </div>

              <div className="glass rounded-2xl p-6 border border-cream/8">
                <div className="flex items-center gap-2 mb-5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isReady ? "bg-moss-light pulse-dot" : "bg-cream/15"}`} />
                  <h3 className="text-mono text-xs text-cream/50 uppercase tracking-widest">Query</h3>
                  {isReady && (
                    <span className="ml-auto text-mono text-[10px] text-moss-light">
                      {processingStatus?.mode === "rag" ? `${processingStatus?.chunks} vectors` : "full context"}
                    </span>
                  )}
                </div>
                <QueryPanel ready={isReady} devMode={devMode} />
              </div>
            </div>

            {devMode && (
              <div className="glass rounded-2xl p-6 border border-cream/8">
                <DevModePanel processingStatus={processingStatus} strategy={strategy} />
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-cream/5 px-6 sm:px-12 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <path d="M4 28 C4 28 6 14 16 8 C26 2 30 4 30 4 C30 4 28 14 20 20 C14 24.5 8 26 4 28Z" fill="#2E4036"/>
              <path d="M4 28 C8 22 13 17 20 12" stroke="#CC5833" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            </svg>
            <span className="text-mono text-xs text-cream/30">Adaptive RAG</span>
          </div>
          <div className="text-mono text-[10px] text-cream/20">
            all-mpnet-base-v2 · pgvector · FastAPI
          </div>
        </div>
      </footer>
    </div>
  );
}
