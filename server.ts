import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  generateFlashcards,
  generateQuiz,
  summarizeConcept,
  explainCard,
  generateTts,
} from "./src/server/geminiService";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Express JSON Error Handler middleware to ensure JSON error responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("Express middleware error:", err.message);
    return res.status(err.status || 400).json({
      error: err.type === "entity.too.large"
        ? "Document file is too large for memory limits. Please upload a smaller PDF or document."
        : err.message || "Invalid JSON or payload error.",
    });
  }
  next();
});

// Small helper so every route shares the same try/catch -> JSON error shape
// that the Netlify functions in netlify/functions/ also use.
function wrap(fn: (req: express.Request) => Promise<any>) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const data = await fn(req);
      res.json(data);
    } catch (err: any) {
      console.error("AI route error:", err.message);
      res.status(err.status || 500).json({ error: err.message || "Request failed." });
    }
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. AI Flashcard Generator (Topic, Notes, or PDF/Document Upload)
app.post("/api/ai/generate-flashcards", wrap((req) => generateFlashcards(req.body)));

// 2. AI Quiz Generator
app.post("/api/ai/generate-quiz", wrap((req) => generateQuiz(req.body)));

// 3. AI Concept Summarizer & Tutor
app.post("/api/ai/summarize-concept", wrap((req) => summarizeConcept(req.body)));

// 4. AI Deep Dive / Mnemonic Explainer for a Flashcard
app.post("/api/ai/explain-card", wrap((req) => explainCard(req.body)));

// 5. Text-to-Speech endpoint for reading flashcards
app.post("/api/ai/tts", wrap((req) => generateTts(req.body)));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RecallAI Server running on http://localhost:${PORT}`);
  });
}

startServer();
