import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Word, QuizQuestion, QuizDirection } from '../types';

// Vite derleme sırasında process.env.GEMINI_API_KEY doğrudan gerçek API anahtarı metniyle değiştirilir
const apiKey: string = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to capitalize first letter
const capitalize = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateWordGroup = async (topic: string, level: string, count: number = 10): Promise<Word[]> => {
  if (!apiKey) {
    throw new Error("Yapay zeka ile kelime grubu oluşturmak için GEMINI_API_KEY bulunamadı. Lütfen GitHub Secrets ayarlarınızı kontrol edin.");
  }

  const modelId = "gemini-2.5-flash";

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        en: { type: Type.STRING, description: "The English word or phrase" },
        tr: { type: Type.STRING, description: "The Turkish translation" },
      },
      required: ["en", "tr"],
    },
  };

  const prompt = `Generate a list of ${count} English vocabulary words related to the topic "${topic}" suitable for CEFR level "${level}". 
  Provide the Turkish translation for each. Ensure the words are appropriate for the level.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are an expert English language teacher for Turkish students.",
      },
    });

    const rawData = response.text;
    if (!rawData) return [];

    const parsedData = JSON.parse(rawData) as { en: string; tr: string }[];

    return parsedData.map(item => ({
      id: generateId(),
      en: item.en,
      tr: item.tr
    }));

  } catch (error) {
    console.error("Error generating word group:", error);
    throw new Error(`Yapay zeka kelime grubu oluştururken hata verdi: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates quiz questions strictly with Gemini AI to guarantee intelligent, contextual distractors.
 * @param words - Words to quiz
 * @param direction - Quiz direction: 'tr-to-en' (show Turkish, answer English) or 'en-to-tr' (show English, answer Turkish)
 */
export const prepareQuizData = async (words: Word[], direction: QuizDirection = 'tr-to-en'): Promise<QuizQuestion[]> => {
  if (!apiKey) {
    throw new Error("Yapay zeka (AI) quiz çeldiricisi üretmek için GEMINI_API_KEY bulunamadı. Lütfen GitHub Secrets anahtarınızı kontrol edin.");
  }

  // Limit to 20 words max for a single quiz session to keep generation fast and reliable
  const selectedWords = words.sort(() => 0.5 - Math.random()).slice(0, 20);
  const modelId = "gemini-2.5-flash";

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        targetWordId: { type: Type.STRING },
        distractors: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["targetWordId", "distractors"]
    }
  };

  // Prepare context based on direction
  const isEnglishAnswer = direction === 'tr-to-en';
  const targetLang = isEnglishAnswer ? 'English' : 'Turkish';
  const showLang = isEnglishAnswer ? 'Turkish' : 'English';

  const wordsListString = selectedWords.map(w =>
    `ID: ${w.id}, ${showLang}: ${isEnglishAnswer ? w.tr : w.en}, ${targetLang}: ${isEnglishAnswer ? w.en : w.tr}`
  ).join('\n');

  const prompt = `
  I need to create a multiple-choice quiz. The user will see a word in ${showLang} and must choose the correct ${targetLang} translation.
  
  ${wordsListString}

  For EACH word in the list above:
  1. Generate 3 distinct ${targetLang} distractors (wrong answers).
  2. The distractors must be grammatically similar (noun for noun, verb for verb).
  3. They should be semantically related but definitely NOT the same meaning as the correct ${targetLang} word.
  4. Return the result linked by the provided ID.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const rawData = response.text;
    if (!rawData) {
      throw new Error("Yapay zeka boş yanıt döndürdü.");
    }

    const parsedData = JSON.parse(rawData) as { targetWordId: string, distractors: string[] }[];

    // Merge AI result with original word objects
    const quizQuestions: QuizQuestion[] = [];

    parsedData.forEach(item => {
      const targetWord = selectedWords.find(w => w.id === item.targetWordId);
      if (targetWord) {
        // Ensure we have 3 distractors
        let distractors = item.distractors;
        while (distractors.length < 3) {
          distractors.push("Option " + (distractors.length + 1));
        }
        distractors = distractors.slice(0, 3);

        // Consistency: Capitalize all options
        const capitalizedDistractors = distractors.map(d => capitalize(d));
        // Correct answer is in the target language
        const correctAnswer = isEnglishAnswer ? targetWord.en : targetWord.tr;
        const capitalizedCorrect = capitalize(correctAnswer);

        const options = [...capitalizedDistractors, capitalizedCorrect].sort(() => 0.5 - Math.random());

        quizQuestions.push({
          targetWord,
          distractors: capitalizedDistractors,
          correctOption: capitalizedCorrect,
          options
        });
      }
    });

    if (quizQuestions.length === 0) {
      throw new Error("Yapay zeka hiçbir kelime için geçerli çeldirici üretemedi.");
    }

    return quizQuestions;

  } catch (error) {
    console.error("Error generating quiz with AI:", error);
    throw new Error(`Yapay zeka (Gemini AI) quiz hazırlarken hata verdi: ${error instanceof Error ? error.message : String(error)}`);
  }
};
