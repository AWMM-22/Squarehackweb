
import { GoogleGenAI, Type } from "@google/genai";
import { RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeSymptoms(symptoms: string[], age: number, gender: string, conversationHistory: string[], lang: 'hi' | 'en') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a rural health assessment for a ${age} year old ${gender} patient. 
      Initial symptoms: ${symptoms.join(', ')}. 
      Conversation History:
      ${conversationHistory.join('\n')}
      
      Based on this conversation, provide a structured health summary in JSON. 
      IMPORTANT: All text fields (diagnosis, recommendations) MUST be in ${lang === 'hi' ? 'Hindi' : 'English'}.`,
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
              description: "Possible diagnosis name.",
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

    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return {
      riskLevel: "MEDIUM",
      diagnosis: lang === 'hi' ? "सामान्य वायरल संक्रमण" : "General Viral Infection",
      recommendations: lang === 'hi' ? ["अच्छी तरह आराम करें", "हाइड्रेटेड रहें", "यदि लक्षण बिगड़ें तो डॉक्टर से संपर्क करें"] : ["Rest well", "Stay hydrated", "Contact doctor if symptoms worsen"],
      confidence: 0.5
    };
  }
}

export async function generateFollowUpQuestion(symptoms: string[], age: number, conversationHistory: string[], questionNumber: number, lang: 'hi' | 'en') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The patient (age ${age}) reports: ${symptoms.join(', ')}. 
      History so far:
      ${conversationHistory.join('\n')}
      
      This is question number ${questionNumber} out of 3. 
      Ask ONE very important clinical follow-up question to determine the severity or narrow down the cause.
      Keep it simple and culturally appropriate for rural India.
      Return JSON with English and Hindi questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            hindiQuestion: { type: Type.STRING }
          },
          required: ["question", "hindiQuestion"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { question: "Can you describe the pain more clearly?", hindiQuestion: "क्या आप अपनी तकलीफ के बारे में थोड़ा और विस्तार से बता सकते हैं?" };
  }
}

export async function generateNutritionQuestion(history: string[], age: number, questionNumber: number, lang: 'hi' | 'en') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a village nutritionist helping a ${age} year old in rural India. 
      Conversation so far:
      ${history.join('\n')}
      
      This is question ${questionNumber} of 3. Ask a simple question about their diet.
      Return JSON with English and Hindi.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            hindiQuestion: { type: Type.STRING }
          },
          required: ["question", "hindiQuestion"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { question: "What did you eat for your main meal today?", hindiQuestion: "आज आपने मुख्य भोजन में क्या खाया?" };
  }
}

export async function getFinalNutritionAdvice(history: string[], age: number, lang: 'hi' | 'en') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a village nutritionist. Based on this conversation with a ${age} year old:
      ${history.join('\n')}
      
      Provide 3 simple, actionable nutritional tips using local Indian seasonal ingredients.
      IMPORTANT: All text MUST be in ${lang === 'hi' ? 'Hindi' : 'English'}.
      Return JSON with a summary advice and a list of tips.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "One sentence summary" },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "tips"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { 
      summary: lang === 'hi' ? "अपने आहार में अधिक हरी सब्जियां और प्रोटीन शामिल करें।" : "Add more green vegetables and proteins to your diet.", 
      tips: lang === 'hi' ? ["मौसमी फल खाएं", "अधिक दालें शामिल करें", "साफ पानी पिएं"] : ["Eat seasonal fruits", "Include more pulses/dal", "Drink clean water"] 
    };
  }
}

export async function getNutritionAdvice(person: string, age: number, lang: 'hi' | 'en') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 1-sentence nutritional advice in ${lang === 'hi' ? 'Hindi' : 'English'} for a ${age} year old living in rural India. Focus on locally available seasonal food.`,
    });
    return response.text?.trim() || (lang === 'hi' ? "ताज़ा फल खाएं।" : "Eat fresh fruits.");
  } catch (e) {
    return lang === 'hi' ? "ताज़ा फल खाएं।" : "Eat fresh fruits.";
  }
}
