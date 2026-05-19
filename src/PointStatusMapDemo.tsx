import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PointMapScene from "./components/PointMapScene";
import PointStatusPanel from "./components/PointStatusPanel";
import HeaderBar from "./components/HeaderBar";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import { pointStatusDictionaries } from "./pointStatusI18n";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { DemoStep, Language, LogKey, PointMapNode, PointStatus, PointStatusMapState } from "./types";

const STEP_COUNT = 7;
const STEP_DURATION_MS = 2300;
const LOOP_RESTART_MS = 1000;
const DEFAULT_SHOWCASE_DEMO_ID = "demo2-point-status";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["pointMapLoaded"],
  2: ["pointOutOccupied"],
  3: ["pointTargetReceivable"],
  4: ["pointTaskCreated"],
  5: ["pointAgvRunning"],
  6: ["pointTaskCompleted"],
  7: ["pointExceptionShown"],
};

const BASE_POINTS: PointMapNode[] = [
  { id: "OUT-01", type: "asrsExit", status: "empty", material: "SKU-A" },
  { id: "OUT-02", type: "asrsExit", status: "empty" },
  { id: "PRE-01", type: "preBuffer", status: "occupied", material: "SKU-B" },
  { id: "PRE-02", type: "preBuffer", status: "empty" },
  { id: "BUF-01", type: "buffer", status: "empty" },
  { id: "L1-P01", type: "lineSide", status: "receivable" },
  { id: "L1-P02", type: "lineSide", status: "notReceivable" },
  { id: "L2-P01", type: "lineSide", status: "waitingReturn" },
  { id: "EX-01", type: "exceptionPoint", status: "exception" },
];

const emptyStats: Record<PointStatus, number> = {
  empty: 0,
  occupied: 0,
  reserved: 0,
  waitingReturn: 0,
  exception: 0,
  receivable: 0,
  notReceivable: 0,
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

function statusForPoint(point: PointMapNode, currentStep: DemoStep): PointStatus {
  if (point.id === "OUT-01") {
    if (currentStep >= 6) return "empty";
    if (currentStep >= 2) return "occupied";
    return "empty";
  }

  if (point.id === "L1-P01") {
    if (currentStep >= 6) return "occupied";
    if (currentStep >= 4) return "reserved";
    return "receivable";
  }

  if (point.id === "BUF-01" && currentStep >= 7) {
    return "receivable";
  }

  return point.status;
}

function selectedPointForStep(currentStep: DemoStep) {
  if (currentStep <= 2) return "OUT-01";
  if (currentStep <= 6) return "L1-P01";
  return "L2-P01";
}

function activeStatusesForStep(currentStep: DemoStep): PointStatus[] {
  if (currentStep === 1) return ["empty", "occupied", "receivable", "notReceivable", "waitingReturn", "exception"];
  if (currentStep === 2) return ["occupied"];
  if (currentStep === 3) return ["receivable"];
  if (currentStep === 4 || currentStep === 5) return ["reserved"];
  if (currentStep === 6) return ["occupied"];
  return ["waitingReturn", "exception", "notReceivable", "receivable"];
}

function derivePointStatusState(currentStep: DemoStep): PointStatusMapState {
  const points = BASE_POINTS.map((point) => ({
    ...point,
    status: statusForPoint(point, currentStep),
    task: point.id === "L1-P01" && currentStep >= 4 && currentStep <= 6 ? "TASK-MAP-001" : point.task,
  }));

  const stats = points.reduce<Record<PointStatus, number>>(
    (result, point) => ({
      ...result,
      [point.status]: result[point.status] + 1,
    }),
    { ...emptyStats },
  );

  return {
    activeStage: activeStageForStep(currentStep),
    points,
    selectedPointId: selectedPointForStep(currentStep),
    taskStatus: currentStep <= 2 ? "notGenerated" : currentStep <= 4 ? "pending" : currentStep === 5 ? "running" : "completed",
    routeState: currentStep <= 3 ? "blocked" : currentStep === 4 ? "allowed" : currentStep === 5 ? "active" : "complete",
    agvStatus: currentStep <= 2 ? "standby" : currentStep <= 4 ? "pending" : currentStep === 5 ? "running" : "completed",
    stats,
    activeStatuses: activeStatusesForStep(currentStep),
    showExceptionFocus: currentStep >= 7,
  };
}

interface PointStatusMapDemoProps {
  onHome?: () => void;
}

export default function PointStatusMapDemo({ onHome }: PointStatusMapDemoProps) {
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

  const t = pointStatusDictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => derivePointStatusState(currentStep), [currentStep]);
  const shellClassName = [
    "demo-shell",
    "point-status-shell",
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
          <PointMapScene currentStep={currentStep} state={derivedState} t={t} />
          <PointStatusPanel currentStep={currentStep} state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel currentStep={currentStep} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
