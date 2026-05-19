import type { ComponentType } from "react";

export type ShowcaseLanguage = "zh" | "ja";

export type ShowcaseLocalizedText = Record<ShowcaseLanguage, string>;

export interface DemoRouteProps {
  onHome?: () => void;
}

export interface ShowcaseDemoItem {
  id: string;
  title: ShowcaseLocalizedText;
  subtitle: ShowcaseLocalizedText;
  path: string;
  durationMs: number;
  enabled: boolean;
}

export interface DemoRegistryItem extends ShowcaseDemoItem {
  component: ComponentType<DemoRouteProps>;
  showInPortal: boolean;
  showInShowcase: boolean;
  featured?: boolean;
  portalTag: ShowcaseLocalizedText;
  legacyHashes?: string[];
}

export interface ShowcaseI18nDict {
  app: {
    title: string;
    subtitle: string;
  };
  labels: {
    currentDemo: string;
    currentIndex: string;
    remainingTime: string;
    sceneMenu: string;
    sceneMenuHint: string;
    shortcutHint: string;
  };
  controls: {
    start: string;
    pause: string;
    previous: string;
    next: string;
    replay: string;
    fullscreen: string;
    exitFullscreen: string;
    autoLoop: string;
    menu: string;
    collapseMenu: string;
    closeMenu: string;
    languageZh: string;
    languageJa: string;
  };
  status: {
    playing: string;
    pending: string;
    paused: string;
    completed: string;
    disabled: string;
    autoMode: string;
    manualMode: string;
    pausedMode: string;
  };
  messages: {
    demoDisabled: string;
    demoPreparing: string;
  };
}

export type ShowcaseI18n = Record<ShowcaseLanguage, ShowcaseI18nDict>;
