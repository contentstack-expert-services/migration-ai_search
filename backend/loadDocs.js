import fs from "fs";
import path from "path";
import { addDocument } from "./embeddings.js";
import mammoth from "mammoth";
import { parse } from "csv-parse/sync";
// import pdfParse from "pdf-parse";
import pdfParse from "pdf-parse-fixed";


const DOCS_DIR = path.resolve("./docs");

async function loadDocs() {
  const files = fs.readdirSync(DOCS_DIR);

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const ext = path.extname(file).toLowerCase();

    let content = "";

    try {
      if (ext === ".txt" || ext === ".md") {
        content = fs.readFileSync(filePath, "utf-8");
      } else if (ext === ".pdf") {
        const data = await pdfParse(fs.readFileSync(filePath));
        content = data.text;
      } else if (ext === ".docx") {
        const result = await mammoth.extractRawText({ path: filePath });
        content = result.value;
      } else if (ext === ".csv") {
        const csvData = fs.readFileSync(filePath, "utf-8");
        const records = parse(csvData, { columns: false, skip_empty_lines: true });
        content = records.map(r => r.join(" ")).join("\n");
      } else {
        console.log(`⚠️ Skipping unsupported file: ${file}`);
        continue;
      }

      // Simple chunking (~500 words per chunk)
      const chunks = chunkText(content, 500);

      for (let i = 0; i < chunks.length; i++) {
        const id = `${file}-${i}`;
        await addDocument(id, chunks[i]);
        console.log(`✅ Added ${id} to ChromaDB`);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${file}:`, err.message);
    }
  }

  console.log("🚀 All docs loaded into ChromaDB.");
}

function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

loadDocs();
