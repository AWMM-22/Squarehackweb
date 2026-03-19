import { GoogleGenAI, Type } from '@google/genai';
import { NutritionAdvice, RiskLevel } from '../types';

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const isAiEnabled = () => Boolean(ai);

export const analyzeSymptoms = async (payload: {
  symptoms: string[];
  age?: number;
  gender?: string;
  language?: 'en' | 'hi';
}): Promise<{ riskLevel: RiskLevel; diagnosis: string; recommendations: string[]; confidence: number }> => {
  const symptoms = payload.symptoms.filter(Boolean);
  const language = payload.language || 'en';

  if (!ai) {
    return {
      riskLevel: symptoms.length >= 4 ? 'HIGH' : symptoms.length >= 2 ? 'MEDIUM' : 'LOW',
      diagnosis: language === 'hi' ? 'संभावित सामान्य संक्रमण' : 'Possible common infection',
      recommendations:
        language === 'hi'
          ? ['तरल पदार्थ अधिक लें', 'आराम करें', 'लक्षण बढ़ें तो डॉक्टर से संपर्क करें']
          : ['Increase fluid intake', 'Take rest', 'Contact doctor if symptoms worsen'],
      confidence: 0.45,
    };
  }

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are helping triage rural primary-care symptoms safely.\nSymptoms: ${symptoms.join(', ')}\nAge: ${payload.age ?? 'unknown'}\nGender: ${payload.gender ?? 'unknown'}\nReturn language: ${language === 'hi' ? 'Hindi' : 'English'}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
          },
          required: ['riskLevel', 'diagnosis', 'recommendations', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    const risk = String(parsed.riskLevel || 'MEDIUM').toUpperCase() as RiskLevel;

    return {
      riskLevel: risk === 'HIGH' || risk === 'LOW' || risk === 'MEDIUM' ? risk : 'MEDIUM',
      diagnosis: parsed.diagnosis || 'General condition',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  } catch {
    return {
      riskLevel: 'MEDIUM',
      diagnosis: language === 'hi' ? 'स्थिति की पुष्टि आवश्यक' : 'Condition needs further confirmation',
      recommendations:
        language === 'hi'
          ? ['2 घंटे में स्थिति दोबारा जांचें', 'असामान्य लक्षण पर डॉक्टर से बात करें']
          : ['Recheck condition in 2 hours', 'Consult doctor for alarming symptoms'],
      confidence: 0.4,
    };
  }
};

export const getNutritionAdvice = async (payload: {
  age?: number;
  context: string;
  language?: 'en' | 'hi';
}): Promise<NutritionAdvice> => {
  const language = payload.language || 'en';

  if (!ai) {
    return {
      summary:
        language === 'hi'
          ? 'स्थानीय मौसमी भोजन में प्रोटीन और हरी सब्जियां बढ़ाएं।'
          : 'Increase protein and green vegetables using local seasonal food.',
      tips:
        language === 'hi'
          ? ['दाल और चना रोज शामिल करें', 'कम से कम 2 मौसमी फल लें', 'उबला या साफ पानी पिएं']
          : ['Include lentils/chana daily', 'Take at least 2 seasonal fruits', 'Drink boiled or clean water'],
    };
  }

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Prepare rural nutrition guidance for age ${payload.age ?? 'unknown'}. Context: ${payload.context}. Output in ${language === 'hi' ? 'Hindi' : 'English'}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['summary', 'tips'],
        },
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    return {
      summary: parsed.summary || '',
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : [],
    };
  } catch {
    return {
      summary:
        language === 'hi' ? 'संतुलित भोजन और नियमित पानी सेवन रखें।' : 'Maintain balanced meals and hydration.',
      tips:
        language === 'hi'
          ? ['थाली में दाल, सब्जी, अनाज रखें', 'तला भोजन कम करें', 'नींद पूरी लें']
          : ['Keep plate balanced with dal/veg/grains', 'Reduce fried food', 'Maintain proper sleep'],
    };
  }
};

export const getHealthGuideCards = async (payload: {
  language?: 'en' | 'hi';
  context?: string;
}): Promise<Array<{ title: string; text: string }>> => {
  const language = payload.language || 'en';
  const baseFallback =
    language === 'hi'
      ? [
          { title: 'बुखार के खतरे के संकेत', text: '2 दिन से ज्यादा तेज बुखार, सांस में दिक्कत, या बेहोशी पर तुरंत रेफर करें।' },
          { title: 'दस्त और डिहाइड्रेशन', text: 'ORS तुरंत शुरू करें, तरल देते रहें, मल में खून हो तो तुरंत डॉक्टर दिखाएं।' },
          { title: 'गर्भावस्था चेतावनी संकेत', text: 'ब्लीडिंग, तेज सिरदर्द, सूजन या भ्रूण की हलचल कम हो तो तत्काल जांच कराएं।' },
          { title: 'उच्च BP सावधानी', text: 'BP बार-बार 160/100 से ऊपर हो और लक्षण हों तो अस्पताल रेफरल करें।' },
        ]
      : [
          { title: 'Fever Red Flags', text: 'Escalate quickly for high fever beyond 2 days, breathing distress, or confusion.' },
          { title: 'Diarrhea & Dehydration', text: 'Start ORS early, continue fluids, and refer immediately for blood in stool.' },
          { title: 'Pregnancy Warning Signs', text: 'Bleeding, severe headache, swelling, or reduced fetal movement need urgent review.' },
          { title: 'High BP Precaution', text: 'Repeated BP above 160/100 with symptoms should be referred to hospital.' },
        ];

  if (!ai) return baseFallback;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create 4 practical rural health guide cards in ${language === 'hi' ? 'Hindi' : 'English'}.
Context: ${payload.context || 'general family rural health'}.
Each card should have a short title and one clear action-oriented explanation.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['title', 'text'],
              },
            },
          },
          required: ['cards'],
        },
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    if (!cards.length) return baseFallback;
    return cards.slice(0, 4).map((item: any) => ({
      title: String(item?.title || '').trim(),
      text: String(item?.text || '').trim(),
    })).filter((item: { title: string; text: string }) => item.title && item.text);
  } catch {
    return baseFallback;
  }
};

export const transcribeAudioToText = async (payload: {
  audioBase64: string;
  mimeType: string;
  language: 'en' | 'hi' | 'mr';
}): Promise<string> => {
  if (!ai) return '';

  const langName = payload.language === 'mr' ? 'Marathi' : payload.language === 'hi' ? 'Hindi' : 'English';

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Transcribe this rural health audio into plain ${langName}. Return only transcript text.`,
            },
            {
              inlineData: {
                mimeType: payload.mimeType,
                data: payload.audioBase64,
              },
            },
          ],
        },
      ] as any,
    });

    return (res.text || '').trim();
  } catch {
    return '';
  }
};

export const summarizeFieldNote = async (payload: {
  text: string;
  language: 'en' | 'hi' | 'mr';
}): Promise<string> => {
  const text = payload.text.trim();
  if (!text) return '';

  if (!ai) {
    return text.length > 140 ? `${text.slice(0, 137)}...` : text;
  }

  const langName = payload.language === 'mr' ? 'Marathi' : payload.language === 'hi' ? 'Hindi' : 'English';

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize this ASHA field visit note in one concise ${langName} sentence for timeline logging:\n${text}`,
    });

    return (res.text || '').trim() || text;
  } catch {
    return text;
  }
};

type GuidedCondition = 'RESPIRATORY' | 'FEVER' | 'GASTRO' | 'GENERAL';

export const getGuidedInterviewPlan = async (payload: {
  primaryInput: string;
  symptoms: string[];
  language?: 'en' | 'hi';
}): Promise<{ condition: GuidedCondition; questions: string[] }> => {
  const language = payload.language || 'en';
  const fallback =
    language === 'hi'
      ? {
          condition: 'GENERAL' as GuidedCondition,
          questions: [
            'यह समस्या आपको कब से है?',
            'अभी समस्या की गंभीरता क्या है: हल्की, मध्यम या गंभीर?',
            'क्या सांस में दिक्कत, सीने में दर्द, तेज बुखार या बेहोशी है?',
          ],
        }
      : {
          condition: 'GENERAL' as GuidedCondition,
          questions: [
            'Since when are you experiencing this problem?',
            'How severe is it right now: mild, medium, or severe?',
            'Any danger signs such as breathlessness, chest pain, high fever, or fainting?',
          ],
        };

  if (!ai) return fallback;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classify this rural health complaint and generate 3 focused follow-up questions.
Primary complaint: ${payload.primaryInput}
Selected symptoms: ${payload.symptoms.join(', ') || 'none'}
Language: ${language === 'hi' ? 'Hindi' : 'English'}
Condition must be one of: RESPIRATORY, FEVER, GASTRO, GENERAL.
Questions should be simple, patient-friendly, and triage-safe.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['condition', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    const rawCondition = String(parsed.condition || 'GENERAL').toUpperCase();
    const condition: GuidedCondition =
      rawCondition === 'RESPIRATORY' || rawCondition === 'FEVER' || rawCondition === 'GASTRO' || rawCondition === 'GENERAL'
        ? (rawCondition as GuidedCondition)
        : 'GENERAL';

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((q: any) => String(q || '').trim()).filter(Boolean).slice(0, 3)
      : [];

    if (!questions.length) return fallback;
    return { condition, questions };
  } catch {
    return fallback;
  }
};

export const buildGuidedDoctorReport = async (payload: {
  language?: 'en' | 'hi';
  condition: GuidedCondition;
  symptoms: string[];
  qaPairs: Array<{ question: string; answer: string }>;
  triage?: { riskLevel: RiskLevel; diagnosis: string } | null;
}): Promise<string> => {
  const language = payload.language || 'en';
  const qaText = payload.qaPairs.map((item, idx) => `${idx + 1}. Q: ${item.question}\nA: ${item.answer}`).join('\n');
  const baseReport =
    language === 'hi'
      ? `स्थिति: ${payload.condition}\nमुख्य लक्षण: ${payload.symptoms.join(', ') || 'उल्लेख नहीं'}\n${qaText}`
      : `Condition: ${payload.condition}\nPrimary symptoms: ${payload.symptoms.join(', ') || 'Not specified'}\n${qaText}`;

  if (!ai) return baseReport;

  try {
    const triageText = payload.triage
      ? `Triage: ${payload.triage.riskLevel} - ${payload.triage.diagnosis}`
      : 'Triage: not available';

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a concise doctor-ready structured report for a rural teleconsultation in ${language === 'hi' ? 'Hindi' : 'English'}.
${baseReport}
${triageText}
Keep it practical and clinically useful. Include: probable concern, risk cues, and immediate next steps.`,
    });

    const text = (res.text || '').trim();
    return text || baseReport;
  } catch {
    return baseReport;
  }
};

export const generateDoctorDraft = async (payload: {
  patientName: string;
  summary: string;
  followUpAnswers: string[];
  riskLevel?: RiskLevel;
}): Promise<{ advice: string; prescription: string; redFlags: string[] }> => {
  const fallback = {
    advice:
      `Clinical review for ${payload.patientName}: monitor hydration, fever trend, and breathing pattern. ` +
      'Escalate immediately if symptoms worsen or danger signs appear.',
    prescription: 'Paracetamol SOS as clinically appropriate, ORS for dehydration risk, and strict warning-sign counseling.',
    redFlags: ['Breathlessness', 'Persistent high fever', 'Confusion or drowsiness'],
  };

  if (!ai) return fallback;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a concise rural teleconsult doctor draft.
Patient: ${payload.patientName}
Summary: ${payload.summary}
Risk level: ${payload.riskLevel || 'MEDIUM'}
Follow-up notes: ${payload.followUpAnswers.join(' | ') || 'none'}
Output should be practical and safe for primary care with escalation cues.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            prescription: { type: Type.STRING },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['advice', 'prescription', 'redFlags'],
        },
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    const advice = String(parsed.advice || '').trim();
    const prescription = String(parsed.prescription || '').trim();
    const redFlags = Array.isArray(parsed.redFlags)
      ? parsed.redFlags.map((flag: any) => String(flag || '').trim()).filter(Boolean).slice(0, 5)
      : [];

    if (!advice || !prescription) return fallback;
    return { advice, prescription, redFlags: redFlags.length ? redFlags : fallback.redFlags };
  } catch {
    return fallback;
  }
};
