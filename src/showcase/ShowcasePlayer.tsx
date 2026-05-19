import {
  AppstoreOutlined,
  BorderOutlined,
  ExpandOutlined,
  FastBackwardOutlined,
  FastForwardOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  SubnodeOutlined,
} from "@ant-design/icons";
import { Button, Progress, Segmented, Switch } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showcaseDemoPlaylist } from "./demoPlaylist";
import { showcaseI18n } from "./showcaseI18n";
import type { ShowcaseDemoItem, ShowcaseLanguage } from "./types";
import "./ShowcasePlayer.css";

const TICK_MS = 100;
const PLACEHOLDER_DEMO_ID = "showcase-placeholder";

type PlaybackMode = "auto" | "manual";

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function readStoredBoolean(key: string, fallback: boolean) {
  try {
    const value = window.localStorage.getItem(key);
    if (value === "1") return true;
    if (value === "0") return false;
  } catch {
    return fallback;
  }

  return fallback;
}

function getFirstEnabledIndex() {
  return showcaseDemoPlaylist.findIndex((demo) => demo.enabled);
}

function buildFrameSrc(demo: ShowcaseDemoItem, language: ShowcaseLanguage, isPlaying: boolean, reloadAt: number, captionEnabled: boolean, voiceEnabled: boolean) {
  const url = new URL(demo.path, window.location.origin);
  url.searchParams.set("showcase", "1");
  url.searchParams.set("autoplay", isPlaying ? "1" : "0");
  url.searchParams.set("loop", "0");
  url.searchParams.set("hideControls", "1");
  url.searchParams.set("hideHeader", "1");
  url.searchParams.set("compact", "1");
  url.searchParams.set("caption", captionEnabled ? "1" : "0");
  url.searchParams.set("captionMode", "compact");
  url.searchParams.set("voice", voiceEnabled ? "1" : "0");
  url.searchParams.set("logMode", "compact");
  url.searchParams.set("lang", language);
  url.searchParams.set("demoId", demo.id);

  if (reloadAt > 0) {
    url.searchParams.set("reloadAt", String(reloadAt));
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function isDemoCompletedMessage(data: unknown): data is { type: "DEMO_COMPLETED"; demoId: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    "demoId" in data &&
    data.type === "DEMO_COMPLETED" &&
    typeof data.demoId === "string"
  );
}

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

export default function ShowcasePlayer() {
  const [language, setLanguage] = useState<ShowcaseLanguage>("zh");
  const [currentIndex, setCurrentIndex] = useState(() => getFirstEnabledIndex());
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameAutoplay, setFrameAutoplay] = useState(true);
  const [isLoop, setIsLoop] = useState(true);
  const [captionEnabled, setCaptionEnabled] = useState(() => readStoredBoolean("showcase.captionEnabled", true));
  const [voiceEnabled, setVoiceEnabled] = useState(() => readStoredBoolean("showcase.voiceEnabled", false));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("auto");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reloadAt, setReloadAt] = useState(0);
  const [showDisabledNotice, setShowDisabledNotice] = useState(false);
  const [completedDemoIds, setCompletedDemoIds] = useState<Set<string>>(() => new Set());
  const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
  const shellRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  const transitionLockedRef = useRef(false);

  const t = showcaseI18n[language];
  const enabledIndexes = useMemo(() => showcaseDemoPlaylist.flatMap((demo, index) => (demo.enabled ? [index] : [])), []);
  const fallbackDemo = useMemo<ShowcaseDemoItem>(
    () => ({
      id: PLACEHOLDER_DEMO_ID,
      title: {
        zh: t.messages.demoPreparing,
        ja: t.messages.demoPreparing,
      },
      subtitle: {
        zh: t.messages.demoDisabled,
        ja: t.messages.demoDisabled,
      },
      path: "/placeholder",
      durationMs: 12000,
      enabled: true,
    }),
    [t],
  );
  const currentDemo = currentIndex >= 0 ? showcaseDemoPlaylist[currentIndex] : fallbackDemo;
  const frameSrc = useMemo(() => buildFrameSrc(currentDemo, language, frameAutoplay, reloadAt, captionEnabled, voiceEnabled), [currentDemo, frameAutoplay, language, reloadAt]);
  const progressPercent = currentDemo.durationMs > 0 ? Math.min(100, (elapsedMs / currentDemo.durationMs) * 100) : 0;
  const remainingMs = Math.max(0, currentDemo.durationMs - elapsedMs);
  const playbackStateLabel = isPlaying ? t.status.playing : t.status.paused;
  const modeLabel = playbackMode === "manual" ? t.status.manualMode : t.status.autoMode;
  const modeTone = !isPlaying ? "paused" : playbackMode;

  const touchInteraction = useCallback(() => {
    setLastInteractionAt(Date.now());
  }, []);

  const cancelPendingAdvance = useCallback(() => {
    if (completionTimerRef.current) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
    transitionLockedRef.current = false;
  }, []);

  const resetFrame = useCallback(() => {
    touchInteraction();
    cancelPendingAdvance();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setElapsedMs(0);
    setFrameAutoplay(isPlaying);
    setReloadAt(Date.now());
  }, [cancelPendingAdvance, isPlaying, touchInteraction]);

  const sendControlMessage = useCallback((type: "SHOWCASE_PAUSE" | "SHOWCASE_PLAY") => {
    iframeRef.current?.contentWindow?.postMessage({ type }, window.location.origin);
  }, []);

  const sendSettingsMessage = useCallback(
    (settings?: Partial<{ captionEnabled: boolean; voiceEnabled: boolean }>) => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "SHOWCASE_SETTINGS_CHANGED",
          captionEnabled: settings?.captionEnabled ?? captionEnabled,
          voiceEnabled: settings?.voiceEnabled ?? voiceEnabled,
          captionMode: "compact",
          logMode: "compact",
        },
        window.location.origin,
      );
    },
    [captionEnabled, voiceEnabled],
  );

  const scheduleAdvance = useCallback(
    (delayMs: number) => {
      if (transitionLockedRef.current) return;
      transitionLockedRef.current = true;
      setElapsedMs(currentDemo.durationMs);
      setCompletedDemoIds((previous) => {
        const next = new Set(previous);
        next.add(currentDemo.id);
        return next;
      });

      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
      }

      completionTimerRef.current = window.setTimeout(() => {
        const position = enabledIndexes.indexOf(currentIndex);
        const isLastEnabledDemo = position === enabledIndexes.length - 1;
        completionTimerRef.current = null;

        if (isLastEnabledDemo && !isLoop) {
          setIsPlaying(false);
          transitionLockedRef.current = false;
          return;
        }

        const safePosition = position >= 0 ? position : 0;
        const nextPosition = (safePosition + 1) % enabledIndexes.length;
        setPlaybackMode("auto");
        setCurrentIndex(enabledIndexes[nextPosition]);
        setElapsedMs(0);
        setFrameAutoplay(isPlaying);
        setShowDisabledNotice(false);
        setReloadAt(Date.now());
        transitionLockedRef.current = false;
      }, delayMs);
    },
    [currentDemo.durationMs, currentDemo.id, currentIndex, enabledIndexes, isLoop, isPlaying],
  );

  const switchToIndex = useCallback((index: number) => {
    touchInteraction();
    const demo = showcaseDemoPlaylist[index];
    if (!demo.enabled) {
      setShowDisabledNotice(true);
      setIsDockOpen(true);
      return;
    }

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setCurrentIndex(index);
    setPlaybackMode("manual");
    setShowDisabledNotice(false);
    resetFrame();
  }, [resetFrame, touchInteraction]);

  const selectDemoByIndex = useCallback((index: number, closeDock = false) => {
    touchInteraction();
    const demo = showcaseDemoPlaylist[index];
    if (!demo?.enabled) {
      setShowDisabledNotice(true);
      setIsDockOpen(true);
      return;
    }

    if (closeDock) {
      setIsDockOpen(false);
    }
    switchToIndex(index);
  }, [switchToIndex, touchInteraction]);

  const switchByOffset = useCallback((offset: -1 | 1) => {
    if (enabledIndexes.length === 0) {
      setShowDisabledNotice(true);
      return;
    }

    const position = enabledIndexes.indexOf(currentIndex);
    const safePosition = position >= 0 ? position : 0;
    const nextPosition = (safePosition + offset + enabledIndexes.length) % enabledIndexes.length;
    selectDemoByIndex(enabledIndexes[nextPosition]);
  }, [currentIndex, enabledIndexes, selectDemoByIndex]);

  const handleLanguageChange = useCallback((value: ShowcaseLanguage) => {
    touchInteraction();
    setLanguage(value);
    resetFrame();
  }, [resetFrame, touchInteraction]);

  const handleTogglePlayback = useCallback(() => {
    touchInteraction();
    setIsPlaying((previous) => {
      const next = !previous;
      sendControlMessage(next ? "SHOWCASE_PLAY" : "SHOWCASE_PAUSE");
      return next;
    });
  }, [sendControlMessage, touchInteraction]);

  const handleToggleCaption = useCallback(() => {
    touchInteraction();
    setCaptionEnabled((previous) => {
      const next = !previous;
      sendSettingsMessage({ captionEnabled: next });
      return next;
    });
  }, [sendSettingsMessage, touchInteraction]);

  const handleToggleVoice = useCallback(() => {
    touchInteraction();
    setVoiceEnabled((previous) => {
      const next = !previous;
      if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
      sendSettingsMessage({ voiceEnabled: next });
      return next;
    });
  }, [sendSettingsMessage, touchInteraction]);

  const handleToggleDock = useCallback(() => {
    touchInteraction();
    setIsDockOpen((previous) => !previous);
  }, [touchInteraction]);

  const handleOpenDock = useCallback(() => {
    touchInteraction();
    setIsDockOpen(true);
  }, [touchInteraction]);

  useEffect(() => {
    try {
      window.localStorage.setItem("showcase.captionEnabled", captionEnabled ? "1" : "0");
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
    sendSettingsMessage();
  }, [captionEnabled, sendSettingsMessage]);

  useEffect(() => {
    try {
      window.localStorage.setItem("showcase.voiceEnabled", voiceEnabled ? "1" : "0");
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
    if (!voiceEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    sendSettingsMessage();
  }, [sendSettingsMessage, voiceEnabled]);

  useEffect(() => {
    if (!isPlaying || currentIndex < 0 || enabledIndexes.length === 0) return undefined;

    const timerId = window.setInterval(() => {
      setElapsedMs((previousElapsed) => {
        if (transitionLockedRef.current) return previousElapsed;

        const nextElapsed = Math.min(currentDemo.durationMs, previousElapsed + TICK_MS);
        if (nextElapsed < currentDemo.durationMs) return nextElapsed;

        window.setTimeout(() => scheduleAdvance(0), 0);
        return currentDemo.durationMs;
      });
    }, TICK_MS);

    return () => window.clearInterval(timerId);
  }, [currentDemo.durationMs, currentIndex, enabledIndexes.length, isPlaying, scheduleAdvance]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isDemoCompletedMessage(event.data)) return;
      if (event.data.demoId !== currentDemo.id) return;

      scheduleAdvance(500);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentDemo.id, scheduleAdvance]);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) {
        window.clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    touchInteraction();
    if (!document.fullscreenElement) {
      await shellRef.current?.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  }, [touchInteraction]);

  useEffect(() => {
    if (!isPlaying || !isDockOpen || isDockHovered) return undefined;

    const timerId = window.setInterval(() => {
      if (Date.now() - lastInteractionAt > 5000) {
        setIsDockOpen(false);
      }
    }, 500);

    return () => window.clearInterval(timerId);
  }, [isDockHovered, isDockOpen, isPlaying, lastInteractionAt]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableShortcutTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const numericIndex = Number(event.key) - 1;
      if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < showcaseDemoPlaylist.length) {
        event.preventDefault();
        touchInteraction();
        selectDemoByIndex(numericIndex);
        return;
      }

      if (key === "escape" && isDockOpen) {
        event.preventDefault();
        touchInteraction();
        setIsDockOpen(false);
        return;
      }

      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        handleTogglePlayback();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        switchByOffset(1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        switchByOffset(-1);
        return;
      }

      if (key === "r") {
        event.preventDefault();
        resetFrame();
        return;
      }

      if (key === "f") {
        event.preventDefault();
        void handleToggleFullscreen();
        return;
      }

      if (key === "l") {
        event.preventDefault();
        handleLanguageChange(language === "zh" ? "ja" : "zh");
        return;
      }

      if (key === "c") {
        event.preventDefault();
        handleToggleCaption();
        return;
      }

      if (key === "v") {
        event.preventDefault();
        handleToggleVoice();
        return;
      }

      if (key === "m") {
        event.preventDefault();
        handleToggleDock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleLanguageChange,
    handleToggleCaption,
    handleToggleDock,
    handleToggleFullscreen,
    handleTogglePlayback,
    handleToggleVoice,
    isDockOpen,
    language,
    resetFrame,
    selectDemoByIndex,
    switchByOffset,
    touchInteraction,
  ]);

  return (
    <div className="showcase-shell" ref={shellRef}>
      <header className="showcase-header">
        <div className="showcase-brand">
          <div className="showcase-brand-icon">
            <img src="/genstar-logo-mark.png" alt="GENSTAR" />
          </div>
          <div>
            <strong>{t.app.title}</strong>
            <span>{t.app.subtitle}</span>
          </div>
        </div>

        <div className="showcase-current">
          <div className="showcase-current-label">{t.labels.currentDemo}</div>
          <h1>{currentDemo.title[language]}</h1>
          <p>{currentDemo.subtitle[language]}</p>
          <span>
            {t.labels.currentIndex} {currentIndex + 1} / {showcaseDemoPlaylist.length}
          </span>
        </div>

        <div className="showcase-controls">
          <div className="showcase-control-row">
            <Segmented
              size="small"
              value={language}
              options={[
                { label: t.controls.languageZh, value: "zh" },
                { label: t.controls.languageJa, value: "ja" },
              ]}
              onChange={(value) => handleLanguageChange(value as ShowcaseLanguage)}
            />
            <Button size="small" type={isPlaying ? "default" : "primary"} icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={handleTogglePlayback}>
              {isPlaying ? t.controls.pause : t.controls.start}
            </Button>
            <Button size="small" className="showcase-toggle-button" type={captionEnabled ? "primary" : "default"} icon={<SubnodeOutlined />} onClick={handleToggleCaption}>
              {captionEnabled ? t.controls.captionOn : t.controls.captionOff}
            </Button>
            <Button size="small" className="showcase-toggle-button" type={voiceEnabled ? "primary" : "default"} icon={<SoundOutlined />} onClick={handleToggleVoice}>
              {voiceEnabled ? t.controls.voiceOn : t.controls.voiceOff}
            </Button>
            <Button size="small" type={isDockOpen ? "primary" : "default"} icon={<AppstoreOutlined />} onClick={handleToggleDock}>
              {isDockOpen ? t.controls.collapseMenu : t.controls.menu}
            </Button>
            <Button size="small" icon={isFullscreen ? <BorderOutlined /> : <ExpandOutlined />} onClick={handleToggleFullscreen}>
              {isFullscreen ? t.controls.exitFullscreen : t.controls.fullscreen}
            </Button>
          </div>
        </div>
      </header>

      <main className="showcase-main">
        <section className="showcase-frame-card">
          <iframe ref={iframeRef} title={currentDemo.title[language]} src={frameSrc} onLoad={() => sendSettingsMessage()} />
        </section>
      </main>

      <div className="showcase-bottom-hotzone" onMouseEnter={handleOpenDock} onMouseMove={touchInteraction} />

      <section className={`showcase-mini-progress ${isDockOpen ? "dock-open" : ""}`} aria-label="Showcase mini progress">
        <span>{playbackStateLabel}</span>
        <span className={`showcase-mini-mode ${modeTone}`}>{modeLabel}</span>
        <span>
          {currentIndex + 1} / {showcaseDemoPlaylist.length}
        </span>
        <span>{captionEnabled ? `${t.labels.captionShort} ON` : `${t.labels.captionShort} OFF`}</span>
        <span>{voiceEnabled ? `${t.labels.voiceShort} ON` : `${t.labels.voiceShort} OFF`}</span>
        <strong>{currentDemo.title[language]}</strong>
        <div className="showcase-mini-track">
          <i style={{ width: `${progressPercent}%` }} />
        </div>
        <em>
          {t.labels.remainingTime} {formatDuration(remainingMs)}
        </em>
        <Button size="small" type={isDockOpen ? "primary" : "default"} icon={<AppstoreOutlined />} onClick={handleToggleDock}>
          {isDockOpen ? t.controls.collapseMenu : t.controls.menu}
        </Button>
      </section>

      <footer
        className={`showcase-footer ${isDockOpen ? "open" : ""}`}
        onMouseEnter={() => {
          setIsDockHovered(true);
          touchInteraction();
        }}
        onMouseLeave={() => {
          setIsDockHovered(false);
          touchInteraction();
        }}
        onMouseMove={touchInteraction}
      >
        <section className="showcase-progress-panel">
          <div className="showcase-progress-meta">
            <span>{playbackStateLabel}</span>
            <span className={`showcase-mode-chip ${modeTone}`}>{modeLabel}</span>
            <strong>
              {formatDuration(elapsedMs)} / {formatDuration(currentDemo.durationMs)}
            </strong>
            <em>
              {t.labels.remainingTime} {formatDuration(remainingMs)}
            </em>
          </div>
          <Progress percent={progressPercent} showInfo={false} strokeColor="#22c55e" trailColor="rgba(100,116,139,0.35)" />
          <div className="showcase-dock-actions">
            <Button size="small" icon={<FastBackwardOutlined />} onClick={() => switchByOffset(-1)} disabled={enabledIndexes.length === 0}>
              {t.controls.previous}
            </Button>
            <Button size="small" icon={<FastForwardOutlined />} onClick={() => switchByOffset(1)} disabled={enabledIndexes.length === 0}>
              {t.controls.next}
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={resetFrame}>
              {t.controls.replay}
            </Button>
            <label className="showcase-loop-switch dock-loop">
              <span>{t.controls.autoLoop}</span>
              <Switch
                size="small"
                checked={isLoop}
                onChange={(checked) => {
                  touchInteraction();
                  setIsLoop(checked);
                }}
              />
            </label>
          </div>
          <div className="showcase-shortcut-hint">{t.labels.shortcutHint}</div>
          {showDisabledNotice ? <div className="showcase-disabled-notice">{t.messages.demoDisabled}</div> : null}
        </section>

        <section className="showcase-playlist-strip" aria-label="Demo playlist">
          {showcaseDemoPlaylist.map((demo, index) => {
            const isCurrent = index === currentIndex;
            const statusKind = !demo.enabled ? "disabled" : isCurrent && isPlaying ? "playing" : completedDemoIds.has(demo.id) ? "completed" : "pending";
            const status = t.status[statusKind];

            return (
              <article
                className={`showcase-demo-chip ${isCurrent ? "current" : ""} ${statusKind}`}
                data-disabled={!demo.enabled}
                key={demo.id}
                onClick={() => selectDemoByIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    selectDemoByIndex(index);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="showcase-demo-chip-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <em>{formatDuration(demo.durationMs)}</em>
                </div>
                <strong>{demo.title[language]}</strong>
                <p>{status}</p>
              </article>
            );
          })}
        </section>
      </footer>
    </div>
  );
}
