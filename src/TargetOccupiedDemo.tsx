import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import TargetOccupiedDecisionPanel from "./components/TargetOccupiedDecisionPanel";
import TargetOccupiedPhysicalScene from "./components/TargetOccupiedPhysicalScene";
import { targetOccupiedDictionaries } from "./targetOccupiedI18n";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { DemoStep, Language, LogKey, TargetOccupiedDerivedState } from "./types";

const STEP_COUNT = 7;
const STEP_DURATION_MS = 2300;
const LOOP_RESTART_MS = 1000;
const DEFAULT_SHOWCASE_DEMO_ID = "demo4-target-occupied";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["targetOutArrived"],
  2: ["targetOccupiedFound"],
  3: ["targetRcsHeld"],
  4: ["targetWaitStarted"],
  5: ["targetWaitTimeout"],
  6: ["targetBufferRunning"],
  7: ["targetAlarmCreated"],
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

function deriveTargetOccupiedState(currentStep: DemoStep): TargetOccupiedDerivedState {
  const targetChecked = currentStep >= 2;
  const waitStarted = currentStep >= 4;
  const timeout = currentStep >= 5;
  const bufferRunning = currentStep === 6;
  const bufferCompleted = currentStep >= 7;

  return {
    activeStage: activeStageForStep(currentStep),
    checks: [
      { key: "outArrival", state: "ok" },
      { key: "cargoIdentity", state: currentStep >= 2 ? "ok" : "waiting" },
      { key: "targetReceivable", state: targetChecked ? "ng" : "waiting" },
      { key: "agvPermission", state: "hold" },
    ],
    outStatus: currentStep >= 7 ? "released" : "arrived",
    targetStatus: targetChecked ? "notReceivable" : "unchecked",
    bufferStatus: bufferCompleted ? "buffered" : bufferRunning ? "buffering" : timeout ? "ready" : "empty",
    agvStatus:
      currentStep === 1
        ? "standby"
        : currentStep <= 3
          ? "held"
          : currentStep <= 5
            ? "waiting"
            : currentStep === 6
              ? "buffering"
              : "completed",
    waitStatus: !waitStarted ? "notStarted" : timeout ? "timeout" : "waiting",
    waitProgress: !waitStarted ? 0 : timeout ? 100 : 68,
    waitCountdown: !waitStarted ? "5:00" : timeout ? "0:00" : "1:36",
    originalTaskStatus: "hold",
    bufferTaskStatus: currentStep <= 4 ? "notGenerated" : currentStep === 5 ? "pending" : currentStep === 6 ? "running" : "completed",
    alarmStatus: currentStep >= 6 ? "created" : "notGenerated",
    targetRoute: "blocked",
    bufferRoute: currentStep <= 4 ? "blocked" : bufferCompleted ? "complete" : "active",
    showCargoAtOut: currentStep <= 5,
    showCargoAtBuffer: bufferCompleted,
    showTargetOccupiedPallet: true,
    isClosed: bufferCompleted,
  };
}

interface TargetOccupiedDemoProps {
  onHome?: () => void;
}

export default function TargetOccupiedDemo({ onHome }: TargetOccupiedDemoProps) {
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

  const t = targetOccupiedDictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => deriveTargetOccupiedState(currentStep), [currentStep]);
  const shellClassName = [
    "demo-shell",
    "target-occupied-shell",
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
          <TargetOccupiedPhysicalScene currentStep={currentStep} state={derivedState} t={t} />
          <TargetOccupiedDecisionPanel currentStep={currentStep} state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel currentStep={currentStep} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
