import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import ManualTakeoverControlPanel from "./components/ManualTakeoverControlPanel";
import ManualTakeoverPhysicalScene from "./components/ManualTakeoverPhysicalScene";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import { manualTakeoverDictionaries, type ManualTakeoverTranslationDict } from "./manualTakeoverI18n";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { DemoStep, Language, LogKey, ManualActionId, ManualAuditLog, ManualTakeoverDerivedState } from "./types";

const STEP_COUNT = 7;
const STEP_DURATION_MS = 2300;
const LOOP_RESTART_MS = 1000;
const DEFAULT_SHOWCASE_DEMO_ID = "demo6-manual-takeover";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["manualExceptionCreated"],
  2: ["manualPointReleased"],
  3: ["manualDestinationChanged"],
  4: ["manualBufferStarted"],
  5: ["manualOriginalCancelled"],
  6: ["manualRcsResent"],
  7: ["manualExceptionClosed"],
};

const ACTION_BY_STEP: Partial<Record<DemoStep, ManualActionId>> = {
  2: "manualReleasePoint",
  3: "manualChangeDestination",
  4: "manualTransferBuffer",
  5: "manualCancelTask",
  6: "manualResendRcs",
  7: "manualConfirmException",
};

const ACTION_ORDER: ManualActionId[] = [
  "manualReleasePoint",
  "manualChangeDestination",
  "manualTransferBuffer",
  "manualCancelTask",
  "manualResendRcs",
  "manualConfirmException",
];

const ACTION_TIME: Record<ManualActionId, string> = {
  manualReleasePoint: "10:21:05",
  manualChangeDestination: "10:21:28",
  manualTransferBuffer: "10:22:10",
  manualCancelTask: "10:22:46",
  manualResendRcs: "10:23:18",
  manualConfirmException: "10:24:02",
};

function toDemoStep(value: number): DemoStep {
  return Math.max(1, Math.min(STEP_COUNT, value)) as DemoStep;
}

function appendUniqueLogs(current: LogKey[], next: LogKey[]) {
  return next.reduce<LogKey[]>((merged, key) => (merged.includes(key) ? merged : [...merged, key]), current);
}

function activeStageForStep(step: DemoStep) {
  if (step <= 2) return 1;
  if (step <= 5) return 2;
  return 3;
}

function buildAuditLogs(currentStep: DemoStep, t: ManualTakeoverTranslationDict): ManualAuditLog[] {
  return ACTION_ORDER.filter((actionId) => {
    const step = Object.entries(ACTION_BY_STEP).find(([, value]) => value === actionId)?.[0];
    return step ? Number(step) <= currentStep : false;
  }).map((actionId) => ({
    time: ACTION_TIME[actionId],
    operator: "admin",
    actionId,
    target: t.manual.auditTargets[actionId],
    before: t.manual.auditBefore[actionId],
    after: t.manual.auditAfter[actionId],
    reason: t.manual.auditReasons[actionId],
  }));
}

function deriveManualTakeoverState(currentStep: DemoStep, t: ManualTakeoverTranslationDict): ManualTakeoverDerivedState {
  const currentAction = ACTION_BY_STEP[currentStep];
  const actionStates = ACTION_ORDER.reduce<ManualTakeoverDerivedState["actionStates"]>((result, actionId) => {
    const actionStep = Number(Object.entries(ACTION_BY_STEP).find(([, value]) => value === actionId)?.[0] ?? 99);
    if (actionStep < currentStep) {
      result[actionId] = "done";
    } else if (actionId === currentAction) {
      result[actionId] = "active";
    } else {
      result[actionId] = "idle";
    }
    return result;
  }, {} as ManualTakeoverDerivedState["actionStates"]);

  const rcsActive = currentStep >= 6;
  const closed = currentStep >= 7;

  return {
    activeStage: activeStageForStep(currentStep),
    exceptionStatus: closed ? "closed" : currentStep >= 2 ? "processing" : "active",
    actionStates,
    originalTaskStatus: currentStep >= 5 ? "cancelled" : "blocked",
    bufferTaskStatus: currentStep < 4 ? "notGenerated" : currentStep === 4 ? "running" : "completed",
    rcsTaskStatus: currentStep < 6 ? "notGenerated" : currentStep === 6 ? "sent" : "completed",
    originalRoute: currentStep >= 5 ? "hidden" : "blocked",
    bufferRoute: currentStep < 4 ? "blocked" : currentStep === 4 ? "active" : "complete",
    rcsRoute: currentStep < 6 ? "blocked" : currentStep === 6 ? "active" : "complete",
    pointReleased: currentStep >= 2,
    destinationChanged: currentStep >= 3,
    showCargoAtOut: currentStep <= 4,
    showCargoAtBuffer: currentStep >= 5 && currentStep <= 6,
    showCargoAtNewTarget: closed,
    agvStatus: currentStep === 1 ? "paused" : currentStep < 4 ? "standby" : currentStep === 4 ? "buffering" : currentStep === 6 ? "delivering" : closed ? "completed" : "standby",
    auditLogs: buildAuditLogs(currentStep, t),
    isClosed: closed,
  };
}

interface ManualTakeoverDemoProps {
  onHome?: () => void;
}

export default function ManualTakeoverDemo({ onHome }: ManualTakeoverDemoProps) {
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

  const t = manualTakeoverDictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => deriveManualTakeoverState(currentStep, t), [currentStep, t]);
  const shellClassName = [
    "demo-shell",
    "manual-takeover-shell",
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
          <ManualTakeoverPhysicalScene currentStep={currentStep} state={derivedState} t={t} />
          <ManualTakeoverControlPanel currentStep={currentStep} state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel currentStep={currentStep} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
