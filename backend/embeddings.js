import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";

const INDEX_NAME = "docs";
const DIMENSION = 384; // all-MiniLM-L12-v2 embeddings
const METRIC = "cosine";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Create index if not exists
async function ensureIndex() {
  try {
    const existing = await pc.listIndexes();
    const found = existing.indexes?.find((idx) => idx.name === INDEX_NAME);

    if (!found) {
      console.log(`📦 Creating Pinecone index "${INDEX_NAME}"...`);
      await pc.createIndex({
        name: INDEX_NAME,
        dimension: DIMENSION,
        metric: METRIC,
        spec: {
          serverless: {
            cloud: "aws",   // change to gcp if needed
            region: "us-east-1", // pick the same region as your Pinecone project
          },
        },
      });

      // Wait until index is ready
      let ready = false;
      while (!ready) {
        const idx = await pc.describeIndex(INDEX_NAME);
        if (idx.status?.ready) {
          ready = true;
        } else {
          console.log("⏳ Waiting for Pinecone index to be ready...");
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
      console.log(`✅ Pinecone index "${INDEX_NAME}" is ready.`);
    } else {
      console.log(`✅ Pinecone index "${INDEX_NAME}" already exists.`);
    }
  } catch (err) {
    console.error("❌ Error ensuring Pinecone index:", err.message);
  }
}

await ensureIndex();

const index = pc.index(INDEX_NAME);
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L12-v2");

// -------- Add Document --------
export async function addDocument(id, text) {
  try {
    const embedding = await embedder(text, { pooling: "mean", normalize: true });
    const vector = Array.from(embedding.data);

    await index.upsert([
      { id, values: vector, metadata: { text } },
    ]);
  } catch (err) {
    console.error("❌ Error adding document:", err.message);
  }
}

// -------- Query Docs --------
export async function queryDocs(query, topK = 3) {
  try {
    const embedding = await embedder(query, { pooling: "mean", normalize: true });
    const vector = Array.from(embedding.data);

    const results = await index.query({
      vector,
      topK,
      includeMetadata: true,
    });

    return results.matches?.map((m) => m.metadata.text) || [];
  } catch (err) {
    console.error("❌ Error querying docs:", err.message);
    return [];
  }
}

// -------- Delete Document --------
export async function deleteDocument(id) {
  try {
    await index.deleteOne(id);
  } catch (err) {
    console.error("❌ Error deleting document:", err.message);
  }
}
