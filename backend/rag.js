import fetch from "node-fetch";
import { queryDocs } from "./embeddings.js";

const MODEL = "llama3";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

async function callOllama(prompt) {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,       // 👈 plain string, not messages
        stream: false
      }),
    });

    if (!res.ok) {
      throw new Error("Ollama error: " + res.status);
    }

    const data = await res.json();
    return data.response || "⚠️ No response from Ollama.";
  } catch (err) {
    console.error("❌ Ollama fetch failed:", err.message);
    return "⚠️ Ollama not reachable. Please check if it's running.";
  }
}

export async function retrieveAnswer(question) {
  const docs = await queryDocs(question, 3);
  const context = docs.join("\n");

  if (!context) {
    return "⚠️ No relevant context found in docs.";
  }

  const prompt = `You are an assistant. Use ONLY the context below to answer the question.
Format the answer in **Markdown** (with bullet points, headings, and bold where useful).
If the context is not enough, say 'No relevant context found.'

Context:
${context}

Question: ${question}

Answer (in Markdown):`;

  const answer = await callOllama(prompt);
  return answer.trim();
}
