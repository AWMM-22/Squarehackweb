
import { GoogleGenAI, Type } from "@google/genai";
import { RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeSymptoms(symptoms: string[], age: number, gender: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a rural health assessment for a ${age} year old ${gender} patient with these symptoms: ${symptoms.join(', ')}. Provide a structured health summary for a health worker.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              description: "HIGH, MEDIUM, or LOW risk level.",
            },
            diagnosis: {
              type: Type.STRING,
              description: "Possible diagnosis name in English and Hindi.",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of actionable steps.",
            },
            confidence: {
              type: Type.NUMBER,
              description: "AI confidence score from 0 to 1.",
            }
          },
          required: ["riskLevel", "diagnosis", "recommendations", "confidence"]
        }
      }
    });

    // Fix: Safely handle response text extraction using .text property and trimming.
    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis failed", error);
    // Offline fallback logic
    return {
      riskLevel: "MEDIUM",
      diagnosis: "Common Viral Infection (सामान्य वायरल संक्रमण)",
      recommendations: ["Rest", "Fluid intake", "Monitor temperature"],
      confidence: 0.5
    };
  }
}

export async function getNutritionAdvice(person: string, age: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 1-sentence nutritional advice in Hindi and English for a ${age} year old living in rural India. Focus on locally available seasonal food.`,
    });
    // Fix: Use .text property and handle potential undefined value.
    return response.text?.trim() || "हर दिन ताज़ा फल और सब्जियां खाएं। Eat fresh fruits and vegetables every day.";
  } catch (e) {
    return "हर दिन ताज़ा फल और सब्जियां खाएं। Eat fresh fruits and vegetables every day.";
  }
}
