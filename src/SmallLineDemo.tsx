import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import PhysicalSceneSmallLine from "./components/PhysicalSceneSmallLine";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import SystemDecisionSmallLine from "./components/SystemDecisionSmallLine";
import { dictionaries } from "./i18n";
import { useNarration } from "./showcase/useNarration";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { DemoStep, Language, LogKey, SmallLineDerivedState } from "./types";

const STEP_COUNT = 7;
const STEP_DURATION_MS = 2300;
const LOOP_RESTART_MS = 1000;
const DEFAULT_SHOWCASE_DEMO_ID = "small-line-logistics";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["planImported"],
  2: ["timeTriggered"],
  3: ["linePointAllowed"],
  4: ["deliveryCreated"],
  5: ["deliveryCompleted"],
  6: ["returnCreated"],
  7: ["flowClosed"],
};

function toDemoStep(value: number): DemoStep {
  return Math.max(1, Math.min(STEP_COUNT, value)) as DemoStep;
}

function appendUniqueLogs(current: LogKey[], next: LogKey[]) {
  return next.reduce<LogKey[]>((merged, key) => (merged.includes(key) ? merged : [...merged, key]), current);
}

function activeStageForStep(step: DemoStep) {
  if (step <= 2) return 1;
  if (step <= 4) return 2;
  return 3;
}

function deriveSmallLineState(currentStep: DemoStep): SmallLineDerivedState {
  const deliveryDone = currentStep >= 5;
  const returnDone = currentStep >= 7;

  return {
    activeStage: activeStageForStep(currentStep),
    planStatus: currentStep >= 2 ? "triggered" : "imported",
    linePointStatus:
      currentStep <= 3 ? "empty" : currentStep === 4 ? "receiving" : currentStep === 5 ? "delivered" : currentStep === 6 ? "emptyPalletWaiting" : "available",
    agvStatus:
      currentStep === 1
        ? "standby"
        : currentStep === 2
          ? "ready"
          : currentStep === 3
            ? "pending"
            : currentStep === 4
              ? "delivering"
              : currentStep === 5
                ? "delivered"
                : currentStep === 6
                  ? "returning"
                  : "returned",
    deliveryTaskStatus: currentStep <= 2 ? "notGenerated" : currentStep === 3 ? "pending" : currentStep === 4 ? "running" : "completed",
    returnTaskStatus: currentStep <= 5 ? "notGenerated" : currentStep === 6 ? "running" : "completed",
    checks: [
      { key: "planImport", state: "ok" },
      { key: "timeCall", state: currentStep >= 2 ? "ok" : "waiting" },
      { key: "linePoint", state: currentStep >= 3 ? "ok" : "waiting" },
      { key: "deliveryPermission", state: currentStep >= 3 ? "ok" : "hold" },
    ],
    deliveryRoute: currentStep <= 1 ? "blocked" : currentStep <= 3 ? "active" : deliveryDone ? "complete" : "active",
    returnRoute: currentStep <= 5 ? "hidden" : returnDone ? "complete" : "active",
    showMaterialAtSource: currentStep <= 4,
    showMaterialAtLine: currentStep === 5,
    showEmptyPalletAtLine: currentStep === 6,
    showAgv: true,
    isClosed: returnDone,
  };
}

interface SmallLineDemoProps {
  onHome?: () => void;
}

export default function SmallLineDemo({ onHome }: SmallLineDemoProps) {
  const showcaseMode = useShowcaseMode();
  const completionPostedRef = useRef(false);
  const [language, setLanguage] = useState<Language>(showcaseMode.showcaseLang ?? "zh");
  const [currentStep, setCurrentStep] = useState<DemoStep>(1);
  const [isPlaying, setIsPlaying] = useState(showcaseMode.isShowcaseMode && showcaseMode.shouldAutoplay);
  const [isLoop, setIsLoop] = useState(showcaseMode.shouldLoop);
  const [voiceEnabled, setVoiceEnabled] = useState(showcaseMode.voiceEnabled);
  const [subtitleEnabled, setSubtitleEnabled] = useState(showcaseMode.captionEnabled);
  const [logs, setLogs] = useState<LogKey[]>(STEP_LOGS[1]);
  const autoTimerRef = useRef<number | null>(null);

  const t = dictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => deriveSmallLineState(currentStep), [currentStep]);
  const shellClassName = [
    "demo-shell",
    showcaseMode.shouldHideHeader ? "headerless-mode" : "",
    showcaseMode.isShowcaseMode ? "showcase-mode" : "",
    showcaseMode.isCompactMode ? "compact-mode" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const notifyShowcaseCompleted = useCallback(() => {
    if (!showcaseMode.isShowcaseMode || completionPostedRef.current) return;

    completionPostedRef.current = true;
    window.parent?.postMessage(
      {
        type: "DEMO_COMPLETED",
        demoId: showcaseMode.demoId ?? DEFAULT_SHOWCASE_DEMO_ID,
      },
      window.location.origin,
    );
  }, [showcaseMode.demoId, showcaseMode.isShowcaseMode]);

  const setStepWithLogs = useCallback((step: DemoStep, resetLogs = false) => {
    if (step !== STEP_COUNT) {
      completionPostedRef.current = false;
    }
    setCurrentStep(step);
    setLogs((previous) => (resetLogs ? [...STEP_LOGS[step]] : appendUniqueLogs(previous, STEP_LOGS[step])));
  }, []);

  const handleNext = useCallback(() => {
    setStepWithLogs(toDemoStep(currentStep + 1));
  }, [currentStep, setStepWithLogs]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    completionPostedRef.current = false;
    setStepWithLogs(1, true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [setStepWithLogs]);

  const handleToggleAuto = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentStep === STEP_COUNT) {
      completionPostedRef.current = false;
      setStepWithLogs(1, true);
    }
    setIsPlaying(true);
  }, [currentStep, isPlaying, setStepWithLogs]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const delay = currentStep === STEP_COUNT && isLoop ? LOOP_RESTART_MS : STEP_DURATION_MS;
    autoTimerRef.current = window.setTimeout(() => {
      if (currentStep === STEP_COUNT) {
        notifyShowcaseCompleted();

        if (isLoop) {
          setStepWithLogs(1, true);
        } else {
          setIsPlaying(false);
        }
        return;
      }

      setStepWithLogs(toDemoStep(currentStep + 1));
    }, delay);

    return () => {
      if (autoTimerRef.current) {
        window.clearTimeout(autoTimerRef.current);
      }
    };
  }, [currentStep, isLoop, isPlaying, notifyShowcaseCompleted, setStepWithLogs]);

  useEffect(() => {
    if (showcaseMode.showcaseLang) {
      setLanguage(showcaseMode.showcaseLang);
    }
  }, [showcaseMode.showcaseLang]);

  useEffect(() => {
    if (!showcaseMode.isShowcaseMode) return undefined;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (typeof event.data !== "object" || event.data === null || !("type" in event.data)) return;

      if (event.data.type === "SHOWCASE_PAUSE") {
        setIsPlaying(false);
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      }

      if (event.data.type === "SHOWCASE_PLAY") {
        setIsPlaying(true);
      }

      if (event.data.type === "SHOWCASE_SETTINGS_CHANGED") {
        if ("captionEnabled" in event.data) {
          setSubtitleEnabled(Boolean(event.data.captionEnabled));
        }
        if ("voiceEnabled" in event.data) {
          setVoiceEnabled(Boolean(event.data.voiceEnabled));
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showcaseMode.isShowcaseMode]);

  useNarration({ enabled: voiceEnabled, lang: language, stepKey: currentStep, text: t.subtitles[currentStep] });

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <ConfigProvider locale={antLocale} theme={{ token: { borderRadius: 8, fontFamily: "Inter, Arial, sans-serif" } }}>
      <div className={shellClassName}>
        {showcaseMode.shouldHideHeader ? null : (
          <HeaderBar
            language={language}
            currentStep={currentStep}
            stepCount={STEP_COUNT}
            onHome={showcaseMode.shouldHideControls ? undefined : onHome}
            isPlaying={isPlaying}
            isLoop={isLoop}
            voiceEnabled={voiceEnabled}
            subtitleEnabled={subtitleEnabled}
            hideControls={showcaseMode.shouldHideControls}
            t={t}
            onLanguageChange={setLanguage}
            onToggleAuto={handleToggleAuto}
            onNext={handleNext}
            onReset={handleReset}
            onLoopChange={setIsLoop}
            onVoiceChange={setVoiceEnabled}
            onSubtitleChange={setSubtitleEnabled}
          />
        )}
        <StageTimeline activeStage={derivedState.activeStage} t={t} />
        <main className={`main-area ${currentStep <= 2 ? "focus-scene" : currentStep <= 4 ? "focus-system" : "focus-result"}`}>
          <PhysicalSceneSmallLine currentStep={currentStep} state={derivedState} t={t} />
          <SystemDecisionSmallLine state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel captionMode={showcaseMode.captionMode} currentStep={currentStep} language={language} logMode={showcaseMode.logMode} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
