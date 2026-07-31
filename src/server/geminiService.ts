import { GoogleGenAI, Type } from "@google/genai";

// Lazy initializer for Google GenAI client. Throws a clear error if the
// GEMINI_API_KEY is missing so callers (Express route or Netlify function)
// can turn it into a proper error response instead of a silent crash.
export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Set it in your Netlify Site Configuration → Environment Variables (or your local .env file) and redeploy."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to cleanly parse JSON from Gemini responses, handling potential markdown code blocks
export function parseGeminiJson(response: any): any {
  const text = response.text || "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  }
  return JSON.parse(cleaned);
}

export interface GenerateFlashcardsParams {
  topic?: string;
  notes?: string;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  cardCount?: number;
  difficulty?: string;
  category?: string;
}

export async function generateFlashcards(params: GenerateFlashcardsParams) {
  const {
    topic,
    notes,
    fileBase64,
    fileMimeType,
    fileName,
    cardCount = 8,
    difficulty = "medium",
    category = "general",
  } = params;

  if (!topic && !notes && !fileBase64) {
    const err: any = new Error("Topic, notes, or a document file is required.");
    err.status = 400;
    throw err;
  }

  const ai = getGenAI();

  const promptText = `You are RecallAI, an expert study content creator and document analyst. 
Analyze the provided study material (${fileName ? `Source File: ${fileName}` : "Input Context"}) and generate a high-quality study flashcard deck.

${topic ? `Topic / Focus: ${topic}\n` : ""}
${notes ? `Notes / Text:\n${notes}\n` : ""}
Target Difficulty: ${difficulty}
Requested Number of Cards: ${cardCount}
Category: ${category}

Instructions:
1. Thoroughly parse the content, extracting key definitions, core concepts, essential formulas, historical facts, or principles.
2. Create a clear, concise title and description for the deck reflecting the document's main theme.
3. Formulate ${cardCount} high-yield flashcards with:
   - "front": Clear question, concept, or term.
   - "back": Precise, easy-to-understand answer or definition.
   - "hint": A helpful, subtle hint to aid recall without giving away the full answer.
   - "explanation": A 1-2 sentence deeper breakdown explaining the "why" or context.
   - "difficulty": "${difficulty}"
4. Tags: 2-4 relevant study tags.
Ensure the flashcards focus on high-yield retention items from the document.`;

  const contentsParts: any[] = [];

  if (fileBase64) {
    let mime = fileMimeType || "application/pdf";
    if (mime.includes("text") || mime.includes("markdown")) {
      mime = "text/plain";
    } else if (!mime || mime === "application/octet-stream") {
      mime = "application/pdf";
    }

    contentsParts.push({
      inlineData: {
        mimeType: mime,
        data: fileBase64,
      },
    });
  }

  contentsParts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: contentsParts,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Deck title" },
          description: { type: Type.STRING, description: "Short overview of the deck" },
          category: { type: Type.STRING, description: "Category string" },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Relevant tags",
          },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                hint: { type: Type.STRING },
                explanation: { type: Type.STRING },
                difficulty: { type: Type.STRING, description: "easy, medium, or hard" },
              },
              required: ["front", "back", "hint", "explanation"],
            },
          },
        },
        required: ["title", "description", "category", "tags", "cards"],
      },
    },
  });

  return parseGeminiJson(response);
}

export interface GenerateQuizParams {
  deckTitle?: string;
  cards: Array<{ front: string; back: string }>;
  questionCount?: number;
  quizType?: string;
}

export async function generateQuiz(params: GenerateQuizParams) {
  const { deckTitle, cards, questionCount = 5, quizType = "mix" } = params;

  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    const err: any = new Error("Cards array is required for quiz generation.");
    err.status = 400;
    throw err;
  }

  const ai = getGenAI();

  const formattedCards = cards
    .map((c, i) => `Card ${i + 1}:\nFront: ${c.front}\nBack: ${c.back}`)
    .join("\n\n");

  const prompt = `You are RecallAI's quiz generator. Create an interactive quiz with ${questionCount} questions based on this deck titled "${deckTitle || "Study Deck"}".

Deck Content:
${formattedCards}

Quiz Format: ${quizType}
Types allowed: "multiple-choice", "true-false", "fill-blank".

Requirements:
- For "multiple-choice": Provide 4 plausible options in "options" array, and exact correct string in "correctAnswer".
- For "true-false": Provide "True" or "False" as options, correct string in "correctAnswer".
- For "fill-blank": Provide "correctAnswer" as key term.
- "explanation": Clear breakdown explaining why the answer is correct and clarifying common misconceptions.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "multiple-choice | true-false | fill-blank" },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["type", "question", "correctAnswer", "explanation"],
            },
          },
        },
        required: ["questions"],
      },
    },
  });

  return parseGeminiJson(response);
}

export interface SummarizeConceptParams {
  text: string;
  targetAudience?: string;
}

export async function summarizeConcept(params: SummarizeConceptParams) {
  const { text, targetAudience = "high-school" } = params;

  if (!text) {
    const err: any = new Error("Text is required for summarization.");
    err.status = 400;
    throw err;
  }

  const ai = getGenAI();

  const prompt = `You are RecallAI, a friendly master tutor. Explain and break down the following complex concept or text for a ${targetAudience} level student:

Text to explain:
${text}

Requirements:
1. Provide a clear 2-3 sentence executive summary.
2. List 3-5 key takeaways/bullet points.
3. Provide an intuitive, memorable real-world analogy.
4. Give a simplified, jargon-free explanation.
5. Provide 3 suggested flashcards derived directly from this concept (front, back, hint).`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          analogy: { type: Type.STRING },
          simplifiedExplanation: { type: Type.STRING },
          suggestedCards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                hint: { type: Type.STRING },
              },
              required: ["front", "back"],
            },
          },
        },
        required: ["summary", "keyTakeaways", "analogy", "simplifiedExplanation", "suggestedCards"],
      },
    },
  });

  return parseGeminiJson(response);
}

export interface ExplainCardParams {
  front: string;
  back: string;
  question?: string;
}

export async function explainCard(params: ExplainCardParams) {
  const { front, back, question } = params;

  if (!front || !back) {
    const err: any = new Error("Front and back text are required.");
    err.status = 400;
    throw err;
  }

  const ai = getGenAI();

  const prompt = `You are RecallAI. A student is studying a flashcard and needs help understanding it deeply.
Flashcard Question: "${front}"
Flashcard Answer: "${back}"
${question ? `Student's specific question: "${question}"` : ""}

Provide a tutor response containing:
1. "deeperBreakdown": Step-by-step simple explanation.
2. "mnemonic": A clever memory trick or acronym to easily remember this concept.
3. "realWorldExample": Practical scenario showing this in action.
4. "commonPitfalls": 1-2 common mistakes or traps students make with this.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          deeperBreakdown: { type: Type.STRING },
          mnemonic: { type: Type.STRING },
          realWorldExample: { type: Type.STRING },
          commonPitfalls: { type: Type.STRING },
        },
        required: ["deeperBreakdown", "mnemonic", "realWorldExample", "commonPitfalls"],
      },
    },
  });

  return parseGeminiJson(response);
}

export interface GenerateTtsParams {
  text: string;
  voice?: string;
}

export async function generateTts(params: GenerateTtsParams) {
  const { text, voice = "Kore" } = params;

  if (!text) {
    const err: any = new Error("Text is required for TTS.");
    err.status = 400;
    throw err;
  }

  const ai = getGenAI();

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Speak clearly: ${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    const err: any = new Error("No audio generated from TTS model.");
    err.status = 500;
    throw err;
  }

  return { audioBase64: base64Audio };
}
