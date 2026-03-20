## Adaptive RAG — Frontend

### Setup

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure the API URL

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### Features

#### Normal Mode (dev toggle OFF)
- Upload a PDF
- Select no pruning strategy (default)
- Ask a question, get an answer with source pages

#### Dev Mode (click `</>` dev in navbar)
Exposes the full backend pipeline:

1. **Pruning Strategy Selector** — choose between `none`, `cosine`, `cosine_whitened`, `kmeans`, `mmr`
2. **Pipeline Inspector** — step-by-step breakdown of ingestion → chunking → embedding → pruning → storage
3. **Pruning Report** — per-chunk scores, threshold, retention rate, score distribution
4. **Embedding Visualizer** — 768D vector heat map (sampled) per chunk
5. **Query Parameters** — temperature slider, max tokens, MaxSim re-ranking toggle

#### Strategy reset
Switching pruning strategies automatically calls `/reset` before re-uploading, so stale vectors from a previous strategy don't pollute the new run.

---

### Backend Setup

This frontend requires the RAG backend to be running. See the [backend repo](https://github.com/Ujk768/rag-pipeline-backend) for full setup instructions. In short:

```bash
# Install Python dependencies
pip install fastapi uvicorn pymupdf spacy sentence-transformers transformers
pip install bitsandbytes accelerate psycopg2-binary pgvector python-dotenv
python -m spacy download en_core_web_sm

# Configure .env with your DB credentials and HuggingFace token
# Then start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
---

## API endpoints used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload?pruning_strategy=` | Upload PDF, starts background processing |
| GET | `/status` | Poll processing state (polled every 1.5s) |
| GET | `/pruning-report` | Full per-chunk pruning stats |
| POST | `/query` | Ask a question, get answer + sources |
| GET | `/reset` | Clear pgvector + in-memory state |
