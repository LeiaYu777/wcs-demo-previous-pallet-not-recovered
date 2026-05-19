import { useEffect } from "react";
import type { Language } from "../types";

interface UseNarrationOptions {
  enabled: boolean;
  lang: Language;
  stepKey: string | number;
  text: string;
}

export function useNarration({ enabled, lang, stepKey, text }: UseNarrationOptions) {
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      if (enabled) {
        console.info("Web Speech API is not supported in this browser.");
      }
      return undefined;
    }

    window.speechSynthesis.cancel();

    if (!enabled || !text) {
      return undefined;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ja" ? "ja-JP" : "zh-CN";
    utterance.rate = 0.95;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [enabled, lang, stepKey, text]);
}
