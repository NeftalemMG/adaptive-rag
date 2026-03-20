"use client";

import { useState } from "react";
import { queryDocument, QueryResponse } from "@/lib/api";

interface QueryPanelProps {
  ready: boolean;
  devMode: boolean;
}

export default function QueryPanel({ ready, devMode }: QueryPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useMaxsim, setUseMaxsim] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);

  const handleQuery = async () => {
    if (!query.trim() || !ready) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await queryDocument({
        query: query.trim(),
        temperature,
        max_new_tokens: maxTokens,
        use_maxsim: useMaxsim,
      });
      setResponse(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Advanced options — dev mode only */}
      {devMode && (
        <div className="glass-cream rounded-xl p-4 space-y-4 border border-cream/8">
          <p className="text-mono text-xs text-cream/40 uppercase tracking-widest">
            Query Parameters
          </p>

          {/* MaxSim toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cream/80 font-medium">MaxSim Re-ranking</p>
              <p className="text-mono text-[10px] text-cream/35">
                Fetch top-20, re-rank by diversity
              </p>
            </div>

            {/* Proper pill toggle */}
            <button
              onClick={() => setUseMaxsim(!useMaxsim)}
              role="switch"
              aria-checked={useMaxsim}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                useMaxsim ? "bg-clay" : "bg-cream/15"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-cream shadow-md transition-all duration-300 ease-in-out ${
                  useMaxsim ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Sliders — only when maxsim is ON */}
          {useMaxsim && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-cream/8">
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-mono text-xs text-cream/50">Temperature</p>
                  <p className="text-mono text-xs text-clay">{temperature.toFixed(1)}</p>
                </div>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-clay cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-mono text-xs text-cream/50">Max Tokens</p>
                  <p className="text-mono text-xs text-clay">{maxTokens}</p>
                </div>
                <input
                  type="range" min="64" max="512" step="32"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-clay cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Always-visible sliders when maxsim OFF */}
          {!useMaxsim && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-cream/8 opacity-40 pointer-events-none">
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-mono text-xs text-cream/50">Temperature</p>
                  <p className="text-mono text-xs text-cream/30">{temperature.toFixed(1)}</p>
                </div>
                <input type="range" min="0" max="1" step="0.1" value={temperature} readOnly
                  className="w-full accent-clay cursor-not-allowed" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <p className="text-mono text-xs text-cream/50">Max Tokens</p>
                  <p className="text-mono text-xs text-cream/30">{maxTokens}</p>
                </div>
                <input type="range" min="64" max="512" step="32" value={maxTokens} readOnly
                  className="w-full accent-clay cursor-not-allowed" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query textarea */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleQuery();
            }
          }}
          placeholder={ready ? "Ask anything about your document..." : "Upload a document first"}
          disabled={!ready || loading}
          rows={3}
          className={`w-full rounded-xl p-4 pr-14 text-sm resize-none transition-all duration-200 outline-none ${
            ready
              ? "bg-cream/5 border border-cream/10 text-cream placeholder-cream/25 focus:border-moss/60"
              : "bg-cream/3 border border-cream/5 text-cream/30 cursor-not-allowed"
          }`}
        />
        <button
          onClick={handleQuery}
          disabled={!ready || !query.trim() || loading}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            ready && query.trim() && !loading
              ? "bg-clay hover:bg-clay-light active:scale-90 glow-clay"
              : "bg-cream/8 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4 text-cream/60" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={ready && query.trim() ? "text-cream" : "text-cream/20"}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-mono text-xs text-clay px-3 py-2 rounded-lg bg-clay/10 border border-clay/20">
          {error}
        </p>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4 fade-up">
          <div className="glass rounded-xl p-5 border border-moss/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-moss pulse-dot" />
              <p className="text-mono text-xs text-cream/40 uppercase tracking-widest">
                Answer
                {devMode && (
                  <span className="ml-2 text-clay normal-case">
                    [{response.mode}{response.maxsim_applied ? " + maxsim" : ""}]
                  </span>
                )}
              </p>
            </div>
            <p className="text-cream/90 text-sm leading-relaxed">{response.answer}</p>
          </div>

          {response.sources.length > 0 && (
            <div>
              <p className="text-mono text-xs text-cream/30 uppercase tracking-widest mb-2">Sources</p>
              <div className="space-y-2">
                {response.sources.map((src, i) => (
                  <div key={i} className="glass-cream rounded-lg p-3 border border-cream/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-mono text-[10px] text-clay">p.{src.page}</span>
                      <div className="h-px flex-1 bg-cream/8" />
                    </div>
                    <p className="text-cream/50 text-xs leading-relaxed">{src.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
