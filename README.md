# ⚕️ AI Pharmacist: Agentic RAG Architecture

A full-stack, decoupled Agentic RAG pipeline designed to bridge the pharmaceutical information asymmetry in India. It utilizes dense vector mathematics and zero-temperature LLM execution to identify and safely verify generic equivalents of branded medications.

## 🚀 System Architecture
* **Edge Client:** React Native (Expo), Native Android Intents for mapping.
* **Orchestration Gateway:** FastAPI (Asynchronous, Stateless), Hugging Face Spaces.
* **Semantic Retrieval:** Pinecone Serverless (HNSW algorithm), `all-MiniLM-L6-v2`.
* **Agentic Verification:** Llama 3.3 70B (via Groq LPU) for deterministic clinical safety.
* **Economic Orchestration:** Gemini 2.5 Flash for O(1) batched live market pricing via Google Search Grounding.

## ⚙️ How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt