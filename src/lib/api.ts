// API types derived directly from backend schemas

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type PruningStrategy = "none" | "cosine" | "cosine_whitened" | "kmeans" | "mmr";

export interface ProcessingStatus {
  status: "idle" | "processing" | "done" | "failed";
  chunks: number;
  error: string | null;
  mode: "full_context" | "rag" | null;
  pruning_strategy?: string;
  pruning_summary?: PruningSummary;
}

export interface PruningSummary {
  total_chunks: number;
  chunks_kept: number;
  chunks_pruned: number;
  retention_rate_pct: number;
  pruning_rate_pct: number;
  storage_vectors_saved: number;
  estimated_storage_saved_pct: number;
}

export interface ChunkDetail {
  index: number;
  page_number: number;
  content_preview: string;
  score: number;
  kept: boolean;
  pruned: boolean;
}

export interface PruningReport {
  strategy: string;
  summary: PruningSummary;
  threshold: {
    value: number;
    description: string;
  };
  score_stats: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  per_chunk_detail: ChunkDetail[];
  strategy_metadata: Record<string, unknown>;
}

export interface QueryRequest {
  query: string;
  temperature?: number;
  max_new_tokens?: number;
  use_maxsim?: boolean;
}

export interface QueryResponse {
  query: string;
  answer: string;
  mode: "full_context" | "rag";
  maxsim_applied: boolean;
  sources: Array<{ page: number; text: string }>;
}

export interface UploadResponse {
  message: string;
  pruning_strategy: string;
}

export interface StoredChunk {
  id: number;
  page_number: number;
  content: string;
  // embedding is a 768-float array returned from the DB
  embedding: number[];
}

export interface StoredChunksResponse {
  mode: "rag" | "full_context";
  total: number;
  chunks: StoredChunk[];
}

// API client functions

export async function uploadPDF(
  file: File,
  pruningStrategy: PruningStrategy
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(
    `${API_BASE}/upload?pruning_strategy=${pruningStrategy}`,
    { method: "POST", body: formData }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function getStatus(): Promise<ProcessingStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function getPruningReport(): Promise<PruningReport> {
  const res = await fetch(`${API_BASE}/pruning-report`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "No report available" }));
    throw new Error(err.detail || "No report available");
  }
  return res.json();
}

export async function queryDocument(req: QueryRequest): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Query failed" }));
    throw new Error(err.detail || "Query failed");
  }
  return res.json();
}

export async function resetData(): Promise<void> {
  const res = await fetch(`${API_BASE}/reset`);
  if (!res.ok) throw new Error("Reset failed");
}

export async function getStoredChunks(limit = 20): Promise<StoredChunksResponse> {
  const res = await fetch(`${API_BASE}/chunks?limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "No chunks available" }));
    throw new Error(err.detail || "No chunks available");
  }
  return res.json();
}
