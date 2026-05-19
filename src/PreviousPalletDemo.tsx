import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import PhysicalScene from "./components/PhysicalScene";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import SystemDecisionPanel from "./components/SystemDecisionPanel";
import { previousPalletDictionaries } from "./previousPalletI18n";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { DemoDerivedState, DemoStep, Language, LogKey } from "./types";

const STEP_COUNT = 6;
const STEP_DURATION_MS = 2500;
const LOOP_RESTART_MS = 1000;
const RECOVERY_COMPLETE_MS = 1400;
const DEFAULT_SHOWCASE_DEMO_ID = "demo5-previous-pallet";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["taktDone"],
  2: ["fieldStillWaiting"],
  3: ["nextHeld"],
  4: ["recoveryCreated"],
  5: ["recoveryDone"],
  6: ["nextAllowed"],
  7: ["nextAllowed"],
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

function deriveState(currentStep: DemoStep, recoverySettled: boolean): DemoDerivedState {
  const recoveryCompleted = currentStep >= 6 || (currentStep === 5 && recoverySettled);
  const recoveryRunning = currentStep === 5 && !recoverySettled;
  const nextDeliveryAllowed = currentStep >= 6;

  return {
    activeStage: activeStageForStep(currentStep),
    l2p03Status: recoveryCompleted || nextDeliveryAllowed ? "empty" : "waitingRecovery",
    nextPointStatus: nextDeliveryAllowed ? "allowed" : "waiting",
    recoveryTaskStatus:
      currentStep < 4 ? "notGenerated" : currentStep === 4 ? "pending" : recoveryCompleted || nextDeliveryAllowed ? "completed" : "running",
    nextTaskStatus: nextDeliveryAllowed ? "executable" : currentStep >= 4 ? "waitingPoint" : "hold",
    checks: [
      { key: "takt", state: "ok" },
      { key: "previousRecovery", state: recoveryCompleted || nextDeliveryAllowed ? "ok" : "ng" },
      { key: "pointIdle", state: recoveryCompleted || nextDeliveryAllowed ? "ok" : "ng" },
      { key: "nextPermission", state: nextDeliveryAllowed ? "ok" : "hold" },
    ],
    recoveryRoute: currentStep < 4 ? "hidden" : recoveryCompleted || nextDeliveryAllowed ? "complete" : "active",
    nextRoute: nextDeliveryAllowed ? "allowed" : "blocked",
    showAgv: currentStep >= 4,
    showSourcePallet: !(recoveryRunning || recoveryCompleted || nextDeliveryAllowed),
    showMovingPallet: recoveryRunning,
    recoveryRunning,
    recoveryCompleted: recoveryCompleted || nextDeliveryAllowed,
    nextDeliveryAllowed,
  };
}

interface PreviousPalletDemoProps {
  onHome?: () => void;
}

export default function PreviousPalletDemo({ onHome }: PreviousPalletDemoProps) {
  const showcaseMode = useShowcaseMode();
  const completionPostedRef = useRef(false);
  const [language, setLanguage] = useState<Language>(showcaseMode.showcaseLang ?? "zh");
  const [currentStep, setCurrentStep] = useState<DemoStep>(1);
  const [isPlaying, setIsPlaying] = useState(showcaseMode.isShowcaseMode && showcaseMode.shouldAutoplay);
  const [isLoop, setIsLoop] = useState(showcaseMode.shouldLoop);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);
  const [logs, setLogs] = useState<LogKey[]>(STEP_LOGS[1]);
  const [recoverySettled, setRecoverySettled] = useState(false);
  const autoTimerRef = useRef<number | null>(null);
  const recoveryTimerRef = useRef<number | null>(null);

  const t = previousPalletDictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => deriveState(currentStep, recoverySettled), [currentStep, recoverySettled]);
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
    setRecoverySettled(false);
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
      setRecoverySettled(false);
      completionPostedRef.current = false;
      setStepWithLogs(1, true);
    }
    setIsPlaying(true);
  }, [currentStep, isPlaying, setStepWithLogs]);

  useEffect(() => {
    if (recoveryTimerRef.current) {
      window.clearTimeout(recoveryTimerRef.current);
    }

    if (currentStep === 5) {
      setRecoverySettled(false);
      recoveryTimerRef.current = window.setTimeout(() => {
        setRecoverySettled(true);
      }, RECOVERY_COMPLETE_MS);
      return;
    }

    setRecoverySettled(currentStep >= 6);
  }, [currentStep]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const delay = currentStep === STEP_COUNT && isLoop ? LOOP_RESTART_MS : STEP_DURATION_MS;
    autoTimerRef.current = window.setTimeout(() => {
      if (currentStep === STEP_COUNT) {
        notifyShowcaseCompleted();

        if (isLoop) {
          setRecoverySettled(false);
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
      if (recoveryTimerRef.current) window.clearTimeout(recoveryTimerRef.current);
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
          <PhysicalScene currentStep={currentStep} state={derivedState} t={t} />
          <SystemDecisionPanel currentStep={currentStep} state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel currentStep={currentStep} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
