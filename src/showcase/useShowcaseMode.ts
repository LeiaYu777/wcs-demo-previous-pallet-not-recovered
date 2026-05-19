import { useMemo } from "react";
import type { Language } from "../types";

export interface ShowcaseModeOptions {
  isShowcaseMode: boolean;
  shouldAutoplay: boolean;
  shouldLoop: boolean;
  shouldHideControls: boolean;
  shouldHideHeader: boolean;
  isCompactMode: boolean;
  showcaseLang: Language | undefined;
  demoId: string | undefined;
}

function readShowcaseMode(): ShowcaseModeOptions {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");
  const isShowcaseMode = params.get("showcase") === "1";
  const isCompactMode = params.get("compact") === "1";
  const shouldHideHeader = isShowcaseMode || params.get("hideHeader") === "1" || isCompactMode;

  return {
    isShowcaseMode,
    shouldAutoplay: params.get("autoplay") === "1",
    shouldLoop: params.get("loop") === "1",
    shouldHideControls: params.get("hideControls") === "1",
    shouldHideHeader,
    isCompactMode,
    showcaseLang: lang === "zh" || lang === "ja" ? lang : undefined,
    demoId: params.get("demoId") ?? undefined,
  };
}

export function useShowcaseMode() {
  return useMemo(() => readShowcaseMode(), []);
}
