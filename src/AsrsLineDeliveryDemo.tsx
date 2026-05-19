import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { asrsLineDictionaries } from "./asrsLineI18n";
import AsrsLineDecisionPanel from "./components/AsrsLineDecisionPanel";
import AsrsLinePhysicalScene from "./components/AsrsLinePhysicalScene";
import HeaderBar from "./components/HeaderBar";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { AsrsLineDerivedState, DemoStep, Language, LogKey } from "./types";

const STEP_COUNT = 7;
const STEP_DURATION_MS = 2300;
const LOOP_RESTART_MS = 1000;
const DEFAULT_SHOWCASE_DEMO_ID = "asrs-line-delivery";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["asrsOutArrived"],
  2: ["asrsInspectDone"],
  3: ["asrsTargetAllowed"],
  4: ["asrsTaskCreated"],
  5: ["asrsTaskRunning"],
  6: ["asrsFallbackReady"],
  7: ["asrsFlowComplete"],
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

function deriveAsrsLineState(currentStep: DemoStep): AsrsLineDerivedState {
  const inspectDone = currentStep >= 2;
  const targetAllowed = currentStep >= 3;
  const taskCreated = currentStep >= 4;
  const delivered = currentStep >= 5;
  const strategyVisible = currentStep >= 6;
  const closed = currentStep >= 7;

  return {
    activeStage: activeStageForStep(currentStep),
    outStatus: currentStep >= 4 ? "released" : "arrived",
    inspectStatus: inspectDone ? "confirmed" : "waiting",
    targetStatus: delivered ? "delivered" : targetAllowed ? "available" : "waiting",
    bufferStatus: strategyVisible ? "option" : "standby",
    agvStatus:
      currentStep === 1
        ? "standby"
        : currentStep === 2
          ? "confirming"
          : currentStep === 3
            ? "pending"
            : currentStep === 4
              ? "running"
              : currentStep === 5
                ? "delivered"
                : "strategy",
    deliveryTaskStatus: currentStep <= 2 ? "notGenerated" : currentStep === 3 ? "pending" : currentStep === 4 ? "running" : "completed",
    checks: [
      { key: "outArrival", state: "ok" },
      { key: "inspectConfirm", state: inspectDone ? "ok" : "waiting" },
      { key: "targetReceivable", state: targetAllowed ? "ok" : "waiting" },
      { key: "agvPermission", state: targetAllowed ? "ok" : "hold" },
    ],
    outInspectRoute: inspectDone ? "complete" : "active",
    deliveryRoute: !targetAllowed ? "blocked" : delivered ? "complete" : taskCreated ? "active" : "allowed",
    bufferRoute: strategyVisible ? "active" : "blocked",
    showPalletAtOut: currentStep === 1,
    showPalletAtInspect: currentStep >= 2 && currentStep <= 4,
    showPalletAtTarget: delivered,
    showStrategyBoard: strategyVisible,
    isClosed: closed,
  };
}

interface AsrsLineDeliveryDemoProps {
  onHome?: () => void;
}

export default function AsrsLineDeliveryDemo({ onHome }: AsrsLineDeliveryDemoProps) {
  const showcaseMode = useShowcaseMode();
  const completionPostedRef = useRef(false);
  const [language, setLanguage] = useState<Language>(showcaseMode.showcaseLang ?? "zh");
  const [currentStep, setCurrentStep] = useState<DemoStep>(1);
  const [isPlaying, setIsPlaying] = useState(showcaseMode.isShowcaseMode && showcaseMode.shouldAutoplay);
  const [isLoop, setIsLoop] = useState(showcaseMode.shouldLoop);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);
  const [logs, setLogs] = useState<LogKey[]>(STEP_LOGS[1]);
  const autoTimerRef = useRef<number | null>(null);

  const t = asrsLineDictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => deriveAsrsLineState(currentStep), [currentStep]);
  const shellClassName = [
    "demo-shell",
    "asrs-line-shell",
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
      }

      if (event.data.type === "SHOWCASE_PLAY") {
        setIsPlaying(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showcaseMode.isShowcaseMode]);

  useEffect(() => {
    if (!voiceEnabled) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (!("speechSynthesis" in window)) {
      console.info("Web Speech API is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t.subtitles[currentStep]);
    utterance.lang = language === "zh" ? "zh-CN" : "ja-JP";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }, [currentStep, language, t, voiceEnabled]);

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
        <main className="main-area">
          <AsrsLinePhysicalScene currentStep={currentStep} state={derivedState} t={t} />
          <AsrsLineDecisionPanel currentStep={currentStep} state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel currentStep={currentStep} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
