import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Word, QuizQuestion, QuizDirection, GrammarQuestion } from '../types';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to capitalize first letter
const capitalize = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateWordGroup = async (topic: string, level: string, count: number = 10): Promise<Word[]> => {
  if (!apiKey) throw new Error("API Key is missing");

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
  if (!apiKey) throw new Error("API Key is missing");

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

const BLANK = '___';

/** Cevap karşılaştırması için metni sadeleştirir (büyük/küçük harf, boşluk, kesme işareti, kısaltmalar). */
export const normalizeAnswer = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bcannot\b/g, 'can not')
    .replace(/\bshan't\b/g, 'shall not')
    .replace(/n't\b/g, ' not')
    .replace(/'m\b/g, ' am')
    .replace(/'re\b/g, ' are')
    .replace(/'ve\b/g, ' have')
    .replace(/'ll\b/g, ' will')
    .replace(/[.,!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const isGrammarAnswerCorrect = (question: GrammarQuestion, userAnswer: string): boolean => {
  const normalized = normalizeAnswer(userAnswer);
  return [question.answer, ...question.acceptableAnswers].some(a => normalizeAnswer(a) === normalized);
};

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

type RawGrammarItem = {
  sentence: string;
  baseVerb: string;
  answer: string;
  acceptableAnswers?: string[];
  distractors: string[];
  tr: string;
  explanation: string;
};

const BLANK_ADVERBS = new Set(['already', 'just', 'never', 'ever', 'always', 'usually', 'often', 'sometimes', 'rarely', 'still', 'recently']);

type GrammarCandidate = Omit<GrammarQuestion, 'options'> & { distractors: string[] };

/**
 * İkinci bir yapay zeka kontrolü: hangisinin beklenen cevap olduğunu bilmeden her şıkkı cümleye koyup değerlendirir.
 * Aslında doğru olan çeldiriciler kabul edilen cevaplara taşınır; beklenen cevabı bozuk olan cümleler elenir.
 */
const verifyGrammarCandidates = async (candidates: GrammarCandidate[]): Promise<GrammarQuestion[]> => {
  const items = candidates.map(c => ({
    candidate: c,
    choices: shuffle([c.answer, ...c.distractors]),
  }));

  const listing = items.flatMap(({ candidate, choices }, i) => [
    `Item ${i}:`,
    ...choices.map((choice, j) => `  ${j}) ${candidate.sentence.replace(BLANK, () => choice)}`),
  ]).join(`
`);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Each item below has several versions of the same sentence. For every item, return the numbers of ALL versions that are correct, natural English.
Judge each version on its own. Accept a version if a native speaker could really say or write it, even if it uses a different tense or modal from the other versions (for example the present simple for timetables, or the present continuous for future plans).
Reject versions with grammar errors, wrongly repeated words, or a tense that contradicts the context.

${listing}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.INTEGER },
            correct: { type: Type.ARRAY, items: { type: Type.INTEGER } },
          },
          required: ["item", "correct"],
        },
      },
      temperature: 0,
    },
  });

  const verdicts = new Map(
    (JSON.parse(response.text || '[]') as { item: number; correct: number[] }[]).map(v => [v.item, v.correct])
  );

  return items.flatMap(({ candidate, choices }, i) => {
    const correct = new Set((verdicts.get(i) || []).map(j => choices[j]));
    if (!correct.has(candidate.answer)) return [];

    const { distractors, ...question } = candidate;
    const wrong = distractors.filter(d => !correct.has(d)).slice(0, 3);
    if (wrong.length < 3) return [];

    return [{
      ...question,
      acceptableAnswers: [...question.acceptableAnswers, ...distractors.filter(d => correct.has(d))],
      options: shuffle([question.answer, ...wrong]),
    }];
  });
};

/** Yapay zeka çıktısındaki hatalı maddeleri eler; geçerli olanları aday soruya dönüştürür. */
const toGrammarCandidate = (item: RawGrammarItem): GrammarCandidate | null => {
  const sentence = (item.sentence || '').replace(/_{2,}/g, BLANK).trim();
  const answer = (item.answer || '').trim();
  const baseVerb = (item.baseVerb || '').trim();
  if (sentence.split(BLANK).length !== 2 || !answer || !baseVerb) return null;

  // Boşluğun yanındaki kelime cevapta da varsa cümle bozulur ("He never never forgets")
  const [before, after] = sentence.split(BLANK).map(part => normalizeAnswer(part).split(' '));
  const answerWords = normalizeAnswer(answer).split(' ');
  if (before[before.length - 1] === answerWords[0] || after[0] === answerWords[answerWords.length - 1]) return null;
  // Cevaptaki zarf cümlenin başka bir yerinde de geçiyorsa aynı hata oluşur ("has already left already")
  const outsideWords = [...before, ...after].map(word => word.replace(/[.,!?]/g, ''));
  if (answerWords.some(word => BLANK_ADVERBS.has(word) && outsideWords.includes(word))) return null;

  const acceptableAnswers = (item.acceptableAnswers || []).map(a => a.trim()).filter(Boolean);

  // Doğru sayılabilecek veya tekrar eden çeldiriciler şıklara girmemeli
  const used = new Set([answer, ...acceptableAnswers].map(normalizeAnswer));
  const distractors: string[] = [];
  for (const raw of item.distractors || []) {
    const distractor = raw.trim();
    const key = normalizeAnswer(distractor);
    if (!distractor || used.has(key)) continue;
    used.add(key);
    distractors.push(distractor);
  }
  if (distractors.length < 3) return null;

  return {
    id: generateId(),
    sentence,
    baseVerb,
    answer,
    acceptableAnswers,
    distractors,
    tr: item.tr || '',
    explanation: item.explanation || '',
  };
};

/**
 * Seçilen gramer konusu ve CEFR seviyesine göre fiil boşluklu cümleler üretir.
 * Çeldiriciler aynı istekte üretilir; böylece yazma ve seçme modları aynı veriyi kullanır.
 */
export const generateGrammarExercise = async (
  topic: string,
  level: string,
  count: number = 20
): Promise<GrammarQuestion[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sentence: { type: Type.STRING, description: "English sentence with exactly one ___ in place of the verb phrase" },
        baseVerb: { type: Type.STRING, description: "Hint: base form of the verb, prefixed with 'not' if negative" },
        answer: { type: Type.STRING, description: "The exact text that fills the blank" },
        acceptableAnswers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Other equally correct fillings, e.g. contracted forms" },
        distractors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 5 incorrect fillings" },
        tr: { type: Type.STRING, description: "Natural Turkish translation of the completed sentence" },
        explanation: { type: Type.STRING, description: "One short Turkish sentence explaining why the answer is correct" },
      },
      required: ["sentence", "baseVerb", "answer", "acceptableAnswers", "distractors", "tr", "explanation"],
    },
  };

  const prompt = `
  Create ${count + 8} different fill-in-the-blank sentences to practise the English grammar topic "${topic}" at CEFR level "${level}".

  Rules:
  1. Each sentence contains exactly one blank written as ___ . The blank replaces the COMPLETE, contiguous verb phrase, including auxiliaries and negation (e.g. "doesn't work", "has eaten", "is going to rain").
  2. Do not write questions. Write only affirmative and negative statements.
  3. "baseVerb" is the hint shown to the student: the infinitive without "to" (e.g. "go"). For negative sentences write it as "not / go".
  3b. Replacing ___ with "answer" must produce a correct sentence with NO repeated words. An adverb such as "always" or "never" that comes before the whole verb phrase stays in the sentence, outside the blank, and is NOT part of "answer" (e.g. "He never ___ his homework." -> "forgets"). Only when an adverb sits in the middle of the verb phrase (e.g. "has already eaten") is it part of the blank; then it must not appear in the sentence, and the hint includes it (e.g. "already / eat").
  4. The context (time expressions, signal words) must make "${topic}" the only natural choice.
  5. "acceptableAnswers" lists every other correct filling, such as contracted and full forms.
  6. "distractors" are exactly 5 different fillings that are DEFINITELY WRONG. Test each one by putting it into the sentence: if a native speaker could accept it, even with a slightly different meaning, you must not use it as a distractor. Never offer another tense, modal or future form that also works in that sentence; list every such alternative in "acceptableAnswers" instead. Prefer clearly broken forms of the SAME verb (wrong agreement, wrong participle, missing or wrong auxiliary).
     - Passive Voice: distractors are active forms or broken passives ("is speak", "was build", "has been find"), never a correct passive in another tense or with another modal.
     - Modal Verbs: keep the same modal and break the verb form ("must signed", "must to sign"); never swap in a different modal.
     - Future (will) and Future (be going to): never use the other future form or the present continuous as a distractor.
  6b. When "be" is the main verb, frequency adverbs come AFTER it ("He is never late"), so do not write "He never is late".
  7. Vary subjects, verbs and everyday contexts. Mix affirmative and negative sentences. Keep vocabulary suitable for level "${level}".
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      systemInstruction: "You are an expert English grammar teacher for Turkish students. Every sentence must be grammatically accurate.",
      temperature: 0.9,
    },
  });

  const parsed = JSON.parse(response.text || '[]') as RawGrammarItem[];
  const candidates = parsed
    .map(toGrammarCandidate)
    .filter((c): c is GrammarCandidate => c !== null);
  const questions = (await verifyGrammarCandidates(candidates)).slice(0, count);

  // Çok eksik sonuç geldiyse kullanıcıya yarım bir alıştırma göstermek yerine hata ver
  if (questions.length < Math.ceil(count * 0.75)) {
    throw new Error("Not enough valid grammar questions");
  }

  return questions;
};
