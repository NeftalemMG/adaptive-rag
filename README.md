# Adaptive RAG — Frontend

A Next.js interface for the [Adaptive Multi-Vector Indexing RAG Pipeline](https://github.com/Ujk768/rag-pipeline-backend). Upload PDFs, ask natural language questions, and get grounded answers with page-level source citations — powered by a locally-running backend using pgvector and a configurable Hugging Face LLM.

---

## Features

- **PDF Upload** — Upload documents and monitor processing progress
- **Natural Language Q&A** — Ask questions about uploaded documents
- **Source Citations** — Answers include page-level references from the source document
- **Configurable Generation** — Adjust temperature and token limits per query

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- The [rag-pipeline-backend](https://github.com/Ujk768/rag-pipeline-backend) running locally on port `8000`

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/NeftalemMG/adaptive-rag.git
cd adaptive-rag
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Update the URL if your backend is running on a different host or port.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Backend Setup

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

## Usage

1. **Upload a PDF** — Use the upload interface to submit a document. Processing runs in the background; poll `/status` to track progress.
2. **Ask a question** — Once processing is complete (`status: done`), type a natural language question.
3. **Review the answer** — The response includes the generated answer along with source chunks and page numbers from the original document.

---

## Project Structure

```
adaptive-rag/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── public/           # Static assets
├── next.config.ts    # Next.js configuration
├── tsconfig.json     # TypeScript configuration
└── package.json      # Dependencies and scripts
```

---

## Related

- **Backend:** [rag-pipeline-backend](https://github.com/Ujk768/rag-pipeline-backend)

---

## License

MIT
