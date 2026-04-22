"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  uploadPDF,
  getStatus,
  ProcessingStatus,
  PruningStrategy,
  getDocument,
  pruneDocument,
} from "@/lib/api";

interface UploadPanelProps {
  onProcessingComplete: (status: ProcessingStatus) => void;
  onProcessingStart: () => void;
  devMode: boolean;
  selectedStrategy: PruningStrategy;
  onStrategyChange: (s: PruningStrategy) => void;
  disableUploadBtn: boolean;
  setDisableUploadBtn: (b: boolean) => void;
}

const STRATEGIES: { value: PruningStrategy; label: string; desc: string }[] = [
  { value: "none", label: "None", desc: "Store all chunks verbatim" },
  { value: "cosine", label: "Cosine", desc: "Prune chunks near centroid" },
  {
    value: "cosine_whitened",
    label: "Cosine+Whiten",
    desc: "Decorrelated cosine pruning",
  },
  { value: "kmeans", label: "K-Means", desc: "One rep per cluster" },
  { value: "mmr", label: "MMR", desc: "Balanced coverage & diversity" },
];

export default function UploadPanel({
  onProcessingComplete,
  onProcessingStart,
  devMode,
  selectedStrategy,
  onStrategyChange,
  disableUploadBtn,
  setDisableUploadBtn,
}: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [existingDoc, setExistingDoc] = useState<{
    name: string;
    total_pages: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const status = await getStatus();
      setProcessingStatus(status);
      if (status.status === "done" || status.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        setUploading(false);
        onProcessingComplete(status);
        setDisableUploadBtn(true);
      }
    } catch {
      if (pollRef.current) clearInterval(pollRef.current);
      setUploading(false);
    }
  }, [onProcessingComplete]);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError(null);
    setFile(f);
    setExistingDoc({ name: f.name, total_pages: f.size })
    onProcessingStart();
    setDisableUploadBtn(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await uploadPDF(file);
      pollRef.current = setInterval(pollStatus, 7000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
    setExistingDoc({ name: file.name, total_pages: file.size})
    onProcessingStart();
    setProcessingStatus({status: "processing", mode: "rag", chunks: 0, error: null});
    setDisableUploadBtn(true);

  };

  const handleStrategyChange = async (s: PruningStrategy) => {
    onStrategyChange(s);
    // call specific api to prune docs
    try{
      const res = await pruneDocument(s);
      console.log("Pruning result", res);
    }catch(err){
      console.error("Failed to prune document with strategy", s, err);
    }
  }

  const getExistingDoc = async () => {
    try {
      const res = await getDocument();
      res.has_document
        ? setExistingDoc({
            name: res.document_name || "",
            total_pages: res.total_pages || 0,
          })
        : setExistingDoc(null);
        onProcessingComplete({status: res.has_document ? "done" : "idle", mode: res.mode, chunks: +(res.active_chunks || 0), error: null});
    } catch (e) {
      setExistingDoc({ name: "", total_pages: 0 });
      console.error("Failed to fetch existing document info", e);
    }
  };

  useEffect(() => {
    getExistingDoc();
  }, []);

  useEffect(()=>{
    console.log("existing page",existingDoc?.total_pages)
    console.log("disableUplaod", disableUploadBtn)
  },[existingDoc,disableUploadBtn])

  return (
    <div className="space-y-6">
      {/* Strategy selector — only in dev mode */}
      {devMode && (
        <div className="space-y-3">
          <p className="text-mono text-xs text-cream/40 uppercase tracking-widest">
            Pruning Strategy
          </p>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                onClick={() => existingDoc?.total_pages && handleStrategyChange(s.value)}
                className={`group relative flex-1 min-w-[120px] p-3 rounded-xl text-left transition-all duration-200 ${
                  selectedStrategy === s.value
                    ? "bg-clay/20 border border-clay/60"
                    : "glass-cream border border-cream/5 hover:border-cream/20"
                }`}
              >
                <p
                  className={`text-mono text-xs font-medium ${
                    selectedStrategy === s.value ? "text-clay" : "text-cream/70"
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[10px] text-cream/35 mt-0.5 leading-tight">
                  {s.desc}
                </p>
                {selectedStrategy === s.value && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-clay pulse-dot" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl p-8 transition-all duration-300 overflow-hidden ${
          isDragging
            ? "border-2 border-clay bg-clay/10"
            : +(existingDoc?.total_pages ?? 0) > 0
              ? "border border-moss/60 bg-moss/10"
              : "border border-dashed border-cream/15 hover:border-cream/30 glass-cream"
        }`}
      >
        {/* Scan line on drag */}
        {isDragging && (
          <div className="scan-line absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-clay/30 to-transparent pointer-events-none" />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center gap-4 text-center">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
              existingDoc?.total_pages ? "bg-moss/40" : "bg-cream/5"
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={file ? "text-moss-light" : "text-cream/30"}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>

          {existingDoc?.total_pages ? (
            <div>
              <p className="text-cream font-medium text-sm">{existingDoc.name}</p>
            </div>
          ) : (
            <div>
              <p className="text-cream/70 text-sm font-medium">
                Drop your PDF here
              </p>
              <p className="text-mono text-xs text-cream/30 mt-1">
                or click to browse
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-mono text-xs text-clay px-3 py-2 rounded-lg bg-clay/10 border border-clay/20">
          {error}
        </p>
      )}

      {/* Processing status */}
      {processingStatus && (
        <div
          className={`glass-cream rounded-xl p-4 border ${
            processingStatus.status === "processing"
              ? "border-moss/30"
              : processingStatus.status === "done"
                ? "border-moss/60"
                : "border-clay/30"
          }`}
        >
          <div className="flex items-center gap-3">
            {processingStatus.status === "processing" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-clay status-processing" />
                <p className="text-mono text-xs text-cream/70">
                  Processing document... 
                </p>
              </>
            ) : processingStatus.status === "done" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-moss pulse-dot" />
                <p className="text-mono text-xs text-cream/70">
                  Ready —{" "}
                  {processingStatus.mode === "rag"
                    ? `${processingStatus.chunks} vectors stored`
                    : "full context mode"}
                </p>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-clay" />
                <p className="text-mono text-xs text-clay">
                  {processingStatus.error || "Processing failed"}
                </p>
              </>
            )}
          </div>

          {processingStatus.status === "processing" && (
            <div className="mt-3 h-0.5 bg-cream/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-moss to-clay rounded-full scan-line w-1/3" />
            </div>
          )}

          {processingStatus.status === "done" &&
            devMode &&
            processingStatus.pruning_summary && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Total",
                    val: processingStatus.pruning_summary.total_chunks,
                  },
                  {
                    label: "Kept",
                    val: processingStatus.pruning_summary.chunks_kept,
                  },
                  {
                    label: "Pruned",
                    val: processingStatus.pruning_summary.chunks_pruned,
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-drama text-lg text-clay">{item.val}</p>
                    <p className="text-mono text-[10px] text-cream/40">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={()=> file && handleUpload(file)}
        disabled={disableUploadBtn}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 ${
          disableUploadBtn
            ? "bg-cream/5 text-cream/25 cursor-not-allowed"
            : "bg-clay hover:bg-clay-light text-cream glow-clay active:scale-95"
        }`}
      >
        {file ? (
          <span className="text-mono text-xs">Process Document</span>
        ) : (
          <span className="text-mono text-xs">Processed Document</span>
        )}
      </button>
    </div>
  );
}
