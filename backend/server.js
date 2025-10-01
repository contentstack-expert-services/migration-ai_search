import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { parse } from "csv-parse/sync";
import { retrieveAnswer } from "./rag.js";
import { addDocument, deleteDocument } from "./embeddings.js";
import pdfParse from "pdf-parse-fixed";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DOCS_DIR = path.resolve("./docs");
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const MODEL = "llama3";

// ---------------- Root route ----------------
app.get("/", (req, res) => {
  res.send("✅ AI Search Backend is running. Use POST /ask to query your docs.");
});

// ---------------- Helpers ----------------
async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(filePath, "utf-8");
  } else if (ext === ".pdf") {
    const data = await pdfParse(fs.readFileSync(filePath));
    return data.text;
  } else if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else if (ext === ".csv") {
    const csvData = fs.readFileSync(filePath, "utf-8");
    const records = parse(csvData, { columns: false, skip_empty_lines: true });
    return records.map((r) => r.join(" ")).join("\n");
  }
  throw new Error("Unsupported file type: " + ext);
}

function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

async function indexFile(filePath) {
  try {
    const content = (await parseFile(filePath))?.trim();
    if (!content) {
      console.warn(`⚠️ Skipped empty file: ${path.basename(filePath)}`);
      return;
    }

    const chunks = chunkText(content, 500);
    const fileName = path.basename(filePath);

    for (let i = 0; i < chunks.length; i++) {
      const id = `${fileName}-${i}`;
      await addDocument(id, chunks[i]);
    }

    console.log(`✅ Indexed: ${fileName} (${chunks.length} chunks)`);
  } catch (err) {
    console.error(`❌ Error indexing ${filePath}:`, err.message);
  }
}

async function deleteFileFromPinecone(filename) {
  try {
    const batchSize = 200;
    for (let i = 0; i < 10000; i += batchSize) {
      const ids = Array.from({ length: batchSize }, (_, j) => `${filename}-${i + j}`);
      await Promise.all(ids.map((id) => deleteDocument(id)));
    }
    console.log(`🗑️ Removed all chunks for ${filename} from Pinecone`);
  } catch (err) {
    console.error(`❌ Error removing ${filename} from Pinecone:`, err.message);
  }
}

// ---------------- AI-based Suggested Questions ----------------
let suggestedQuestions = [];

async function extractQuestionsFromDocs() {
  const files = fs.readdirSync(DOCS_DIR);
  const questions = [];

  for (const file of files) {
    if (file.startsWith(".") || file === "Thumbs.db") continue;
    const filePath = path.join(DOCS_DIR, file);
    try {
      const content = await parseFile(filePath);
      const sample = content.slice(0, 1500);

      const prompt = `Generate 5 useful, natural questions a user might ask about this document:\n\n${sample}`;

      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        console.error(`⚠️ Ollama failed for ${file}:`, res.status);
        continue;
      }

      const data = await res.json();
      const aiQuestions = (data.response || "")
        .split("\n")
        .map((q) => q.replace(/^\d+[\).]\s*/, "").trim())
        .filter((q) => q.length > 5);

      aiQuestions.forEach((q) => questions.push(q));
    } catch (err) {
      console.error("❌ Failed to extract questions from", file, err.message);
    }
  }

  suggestedQuestions = questions.slice(0, 50);
}

app.get("/suggested", (req, res) => {
  res.json({ questions: suggestedQuestions });
});

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  try {
    const answer = await retrieveAnswer(question);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Watcher with debounce ----------------
const debounceTimers = new Map();
function startWatcher() {
  console.log("👀 Watching docs/ for changes...");
  fs.watch(DOCS_DIR, (eventType, filename) => {
    if (!filename) return;
    if (filename.startsWith(".")) return;
    clearTimeout(debounceTimers.get(filename));
    debounceTimers.set(
      filename,
      setTimeout(async () => {
        const filePath = path.join(DOCS_DIR, filename);
        if (fs.existsSync(filePath)) {
          console.log(`📥 Detected ${eventType}: ${filename}`);
          await indexFile(filePath);
        } else {
          console.log(`🗑️ File removed: ${filename}`);
          await deleteFileFromPinecone(filename);
        }
        await extractQuestionsFromDocs();
        debounceTimers.delete(filename);
      }, 500)
    );
  });
}

if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

app.listen(4000, async () => {
  console.log("🚀 Backend running on http://localhost:4000");
  console.log(`🤖 Using Ollama at: ${OLLAMA_HOST}`);
  await extractQuestionsFromDocs();
  startWatcher();
});
