import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Word, QuizQuestion, QuizDirection } from '../types';

const getApiKey = (): string => {
  try {
    return (
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.API_KEY) ||
      (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
      ''
    );
  } catch {
    return '';
  }
};

const apiKey = getApiKey();

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance && apiKey) {
    try {
      aiInstance = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI:", e);
    }
  }
  return aiInstance;
};

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to capitalize first letter
const capitalize = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateWordGroup = async (topic: string, level: string, count: number = 10): Promise<Word[]> => {
  const ai = getAI();
  if (!apiKey || !ai) {
    throw new Error("Yapay zeka ile kelime grubu oluşturmak için GEMINI_API_KEY gereklidir. Lütfen GitHub Secrets veya .env ayarlarınızı kontrol edin.");
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
    throw error;
  }
};

/**
 * Generates quiz questions in bulk to avoid latency during gameplay.
 * Processes words in batches if necessary, but here we assume a reasonable quiz size (e.g. 10-20 words).
 * @param words - Words to quiz
 * @param direction - Quiz direction: 'tr-to-en' (show Turkish, answer English) or 'en-to-tr' (show English, answer Turkish)
 */
export const prepareQuizData = async (words: Word[], direction: QuizDirection = 'tr-to-en'): Promise<QuizQuestion[]> => {
  // Limit to 20 words max for a single quiz session to keep generation fast and reliable
  const selectedWords = words.sort(() => 0.5 - Math.random()).slice(0, 20);

  const ai = getAI();
  // If API key is missing or AI client is not available, immediately use smart offline fallback without crashing!
  if (!apiKey || !ai) {
    console.info("Gemini API key is not present or AI is unavailable, generating quiz questions with offline distractor bank.");
    return fallbackGeneration(selectedWords, direction);
  }

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
    if (!rawData) return fallbackGeneration(selectedWords, direction);

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

    return quizQuestions;

  } catch (error) {
    console.error("Error generating quiz bulk:", error);
    return fallbackGeneration(selectedWords, direction);
  }
};

// Curated vocabulary bank for intelligent distractor backfilling when decks have <4 words
const DEFAULT_DISTRACTOR_POOL: { en: string; tr: string }[] = [
  { en: "Approach", tr: "Yaklaşım" },
  { en: "Benefit", tr: "Fayda" },
  { en: "Challenge", tr: "Zorluk" },
  { en: "Discover", tr: "Keşfetmek" },
  { en: "Evaluate", tr: "Değerlendirmek" },
  { en: "Feature", tr: "Özellik" },
  { en: "Gather", tr: "Toplamak" },
  { en: "Hesitate", tr: "Tereddüt etmek" },
  { en: "Improve", tr: "Geliştirmek" },
  { en: "Justify", tr: "Gerekçelendirmek" },
  { en: "Maintain", tr: "Sürdürmek" },
  { en: "Notice", tr: "Fark etmek" },
  { en: "Observe", tr: "Gözlemlemek" },
  { en: "Predict", tr: "Tahmin etmek" },
  { en: "Require", tr: "Gerektirmek" },
  { en: "Suggest", tr: "Önermek" },
  { en: "Tackle", tr: "Ele almak" },
  { en: "Utilize", tr: "Kullanmak" },
  { en: "Vary", tr: "Çeşitlilik göstermek" },
  { en: "Witness", tr: "Tanık olmak" }
];

// Fallback if AI fails completely or for small word counts
const fallbackGeneration = (words: Word[], direction: QuizDirection): QuizQuestion[] => {
  const isEnglishAnswer = direction === 'tr-to-en';

  return words.map(target => {
    // Pick distractors from other words in the list first
    const otherWords = words.filter(w => w.id !== target.id).map(w => isEnglishAnswer ? w.en : w.tr);
    const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
    let distractors = shuffled.slice(0, 3);

    // If still fewer than 3 distractors (e.g. deck has 1-3 words), backfill from curated vocabulary bank
    if (distractors.length < 3) {
      const bankFiltered = DEFAULT_DISTRACTOR_POOL
        .map(item => isEnglishAnswer ? item.en : item.tr)
        .filter(term => term.toLowerCase() !== (isEnglishAnswer ? target.en : target.tr).toLowerCase() && !distractors.includes(term))
        .sort(() => 0.5 - Math.random());

      for (const bankWord of bankFiltered) {
        if (distractors.length >= 3) break;
        distractors.push(bankWord);
      }
    }

    // Consistency: Capitalize all options
    const capitalizedDistractors = distractors.map(d => capitalize(d));
    const correctAnswer = isEnglishAnswer ? target.en : target.tr;
    const capitalizedCorrect = capitalize(correctAnswer);

    const options = [...capitalizedDistractors, capitalizedCorrect].sort(() => 0.5 - Math.random());

    return {
      targetWord: target,
      distractors: capitalizedDistractors,
      correctOption: capitalizedCorrect,
      options
    };
  });
};