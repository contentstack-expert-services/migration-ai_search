# AI Search App (Electron + React + Node + Ollama + ChromaDB)

This bundle contains a minimal bootstrapped RAG app that:
- Runs a local Node backend that indexes documents into a local ChromaDB.
- Uses Ollama running locally for LLM generation.
- Provides a React frontend (chat widget) and an Electron wrapper.
- Watches the `backend/docs/` folder for add/update/delete and syncs ChromaDB automatically.

## What is included
- `backend/` - server, RAG pipeline, embeddings helper, initial doc loader, docs folder placeholder.
- `frontend/` - React app (minimal).
- `electron.js` - Electron wrapper to load the React app.
- `.gitignore`, `README.md`

## Quick setup (macOS / Windows)
Prerequisites:
1. Node.js v18+ installed.
2. npm or yarn.
3. [Ollama](https://ollama.com/) installed and running locally (default: http://localhost:11434).
   - Pull/install a model, for example:
     ```bash
     ollama pull llama3
     ```
   - Start the Ollama daemon:
     ```bash
     ollama serve
     ```

Steps:
1. Unzip the bundle and open a terminal in the `ai-search-app` folder.
2. Install backend deps:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend deps:
   ```bash
   cd ../frontend
   npm install
   ```
4. Start the backend (this also starts the docs watcher):
   ```bash
   cd ../backend
   npm run start
   ```
   - The backend runs on http://localhost:4000
   - It auto-indexes any files placed in `backend/docs/`
5. Start the frontend:
   ```bash
   cd ../frontend
   npm start
   ```
   - React dev server runs on http://localhost:3000
6. (Optional) Run Electron (from project root):
   ```bash
   npm run start:electron
   ```
   - This will open an Electron window pointed at the React app.

## Notes and next steps
- The code uses local ChromaDB storage at `backend/chroma/`.
- Embeddings use a local transformer via `@xenova/transformers`. If you prefer a different embedding approach, update `backend/embeddings.js`.
- Ollama needs to be running locally. The backend posts the prompt to Ollama on `http://localhost:11434/api/generate`.
- The project is a blueprint. You may need to adapt library versions or API details depending on your environment.

## Where to put documents
- Drop `.txt`, `.md`, `.pdf`, `.docx`, or `.csv` files into `backend/docs/`. They will be auto-parsed and indexed.

## Troubleshooting
- If the watcher does not pick up changes on Windows, try using `chokidar` instead of `fs.watch`. The current implementation is intentionally minimal.
- If Ollama's API or model name differs, update `backend/rag.js` `MODEL` constant.

