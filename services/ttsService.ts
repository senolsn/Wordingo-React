// services/ttsService.ts
// Robust English Text-To-Speech (TTS) engine with native voice selection,
// accent preferences (US / UK), and fallback stream for devices without English voice packs.

export type TTSAccent = 'en-US' | 'en-GB';

const ACCENT_STORAGE_KEY = 'wordingo_tts_accent';

export const getStoredAccent = (): TTSAccent => {
  if (typeof window === 'undefined') return 'en-US';
  try {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
    return saved === 'en-GB' ? 'en-GB' : 'en-US';
  } catch {
    return 'en-US';
  }
};

export const setStoredAccent = (accent: TTSAccent) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch (e) {
    console.warn('Could not save TTS accent preference', e);
  }
};

let cachedVoices: SpeechSynthesisVoice[] = [];

export const initVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const loadVoices = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
      }
    } catch (e) {
      console.warn('Error fetching voices:', e);
    }
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
};

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  initVoices();
}

/**
 * Searches for authentic native English voices, strictly rejecting non-English voices
 * (such as Turkish voices that attempt to pronounce English words phonetically).
 */
export const getEnglishVoice = (preferredAccent: TTSAccent = 'en-US'): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter strictly for English voices
  const englishVoices = voices.filter((v) => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    return lang.startsWith('en');
  });

  if (englishVoices.length === 0) return null;

  const targetLang = preferredAccent.toLowerCase(); // 'en-us' or 'en-gb'

  // 1. High quality / natural voice matching the target accent
  const naturalTargetVoice = englishVoices.find((v) => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    const name = v.name.toLowerCase();
    return (
      lang === targetLang &&
      (name.includes('google') ||
        name.includes('natural') ||
        name.includes('online') ||
        name.includes('samantha') ||
        name.includes('daniel') ||
        name.includes('serena') ||
        name.includes('karen') ||
        name.includes('siri') ||
        name.includes('premium'))
    );
  });
  if (naturalTargetVoice) return naturalTargetVoice;

  // 2. Exact match for target accent (e.g. en-US or en-GB)
  const exactAccent = englishVoices.find((v) => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    return lang === targetLang;
  });
  if (exactAccent) return exactAccent;

  // 3. Any high quality English voice (regardless of US/UK)
  const anyNaturalEnglish = englishVoices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('google') ||
      name.includes('natural') ||
      name.includes('online') ||
      name.includes('samantha') ||
      name.includes('daniel')
    );
  });
  if (anyNaturalEnglish) return anyNaturalEnglish;

  // 4. Any English voice available
  return englishVoices[0];
};

/**
 * Speaks an English word or phrase using an authentic English voice.
 * If the device has no English voice pack installed, seamlessly falls back to a clean audio stream.
 */
export const speakEnglish = (
  text: string,
  options?: {
    accent?: TTSAccent;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
) => {
  const trimmed = text.trim();
  if (!trimmed) {
    options?.onEnd?.();
    return;
  }

  const accent = options?.accent || getStoredAccent();
  const voice = getEnglishVoice(accent);

  // If browser SpeechSynthesis with a verified English voice is available
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && voice) {
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.voice = voice;
      utterance.lang = voice.lang || accent;
      utterance.rate = options?.rate ?? 0.88; // Slightly relaxed pace for optimal vocabulary retention
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error, switching to audio fallback:', e);
        playWebAudioFallback(trimmed, accent, options);
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch (e) {
      console.warn('SpeechSynthesis speak failed:', e);
    }
  }

  // Fallback for devices with no English voice installed
  playWebAudioFallback(trimmed, accent, options);
};

/**
 * Fallback audio stream for devices lacking an English TTS voice.
 */
const playWebAudioFallback = (
  text: string,
  accent: TTSAccent,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
) => {
  try {
    const langCode = accent === 'en-GB' ? 'en-GB' : 'en-US';
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(
      text
    )}`;
    const audio = new Audio(audioUrl);

    options?.onStart?.();

    audio.onended = () => {
      options?.onEnd?.();
    };

    audio.onerror = (err) => {
      console.warn('Audio fallback error:', err);
      // Last resort: standard SpeechSynthesis utterance
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = langCode;
          u.rate = 0.88;
          u.onend = () => options?.onEnd?.();
          u.onerror = () => options?.onError?.();
          window.speechSynthesis.speak(u);
          return;
        } catch {
          // ignore
        }
      }
      options?.onError?.();
    };

    audio.play().catch((err) => {
      console.warn('Audio play was prevented by browser policy:', err);
      options?.onError?.();
    });
  } catch (err) {
    console.warn('playWebAudioFallback failed:', err);
    options?.onError?.();
  }
};
