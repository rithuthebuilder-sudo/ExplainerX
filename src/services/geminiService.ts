import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExplanationResponse {
  explanation: string;
  stepByStep: { title: string; content: string }[];
  examples: string[];
  analogies: string[];
  quickFacts: string[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export async function generateExplanation(
  subject: string,
  topic: string,
  level: string
): Promise<ExplanationResponse> {
  const prompt = `Explain the topic "${topic}" in the context of "${subject}" for a ${level} learner. 
  Provide a clear, simple explanation, a step-by-step breakdown (with titles and content for each step), examples, analogies, 3 quick facts, and 2 quiz questions to test understanding.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are an expert tutor who simplifies complex topics for students. Your explanations are clear, engaging, and tailored to the student's learning level (Beginner, Intermediate, Advanced).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING, description: "A simple and clear explanation of the topic." },
          stepByStep: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["title", "content"]
            },
            description: "A step-by-step breakdown of the topic with titles and descriptions." 
          },
          examples: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Real-world examples of the topic." 
          },
          analogies: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Analogies to help understand the topic." 
          },
          quickFacts: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3 quick and interesting facts about the topic." 
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            },
            description: "2 quiz questions to test understanding."
          }
        },
        required: ["explanation", "stepByStep", "examples", "analogies", "quickFacts", "quiz"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateSimplerExplanation(
  originalExplanation: string,
  level: string
): Promise<string> {
  const prompt = `The following explanation was provided for a ${level} learner: "${originalExplanation}". 
  Please explain it even simpler, as if explaining to a younger student or someone with no prior knowledge. Keep it concise.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a tutor who excels at extreme simplification. Use very basic vocabulary and short sentences."
    }
  });

  return response.text;
}

export async function generateRealLifeExample(
  topic: string,
  subject: string
): Promise<string> {
  const prompt = `Give a vivid, relatable real-life example of "${topic}" in "${subject}". Explain how it applies in everyday life.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

export async function generateMoreQuestions(
  topic: string,
  subject: string,
  level: string
): Promise<ExplanationResponse['quiz']> {
  const prompt = `Generate 3 more practice quiz questions for the topic "${topic}" in "${subject}" at a ${level} level.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}
