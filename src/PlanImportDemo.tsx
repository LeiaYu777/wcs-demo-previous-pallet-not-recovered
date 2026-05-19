import { ConfigProvider } from "antd";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GeneratedTaskPanel from "./components/GeneratedTaskPanel";
import HeaderBar from "./components/HeaderBar";
import PlanExcelTable from "./components/PlanExcelTable";
import StageTimeline from "./components/StageTimeline";
import SubtitleAndLogPanel from "./components/SubtitleAndLogPanel";
import { planImportDictionaries } from "./planImportI18n";
import { useShowcaseMode } from "./showcase/useShowcaseMode";
import type { DemoStep, Language, LogKey, PlanImportDerivedState, PlanImportRow, PlanImportTask } from "./types";

const STEP_COUNT = 7;
const STEP_DURATION_MS = 1700;
const LOOP_RESTART_MS = 1000;
const DEFAULT_SHOWCASE_DEMO_ID = "demo1-plan-import";

const STEP_LOGS: Record<DemoStep, LogKey[]> = {
  1: ["planImportLoaded"],
  2: ["planFieldsParsed"],
  3: ["planTargetsIdentified"],
  4: ["planTask001Created"],
  5: ["planTask002Created"],
  6: ["planTask003Created"],
  7: ["planTasksReady"],
};

const PLAN_ROWS: PlanImportRow[] = [
  {
    id: "PLAN-001",
    time: "9:00",
    line: "L1",
    product: "SKU-A",
    materialZh: "瓶",
    materialJa: "ボトル",
    qtyZh: "10托",
    qtyJa: "10パレット",
    target: "L1-P01",
  },
  {
    id: "PLAN-002",
    time: "9:20",
    line: "L1",
    product: "SKU-A",
    materialZh: "盖",
    materialJa: "キャップ",
    qtyZh: "5托",
    qtyJa: "5パレット",
    target: "L1-P02",
  },
  {
    id: "PLAN-003",
    time: "10:00",
    line: "L2",
    product: "SKU-B",
    materialZh: "泵头",
    materialJa: "ポンプヘッド",
    qtyZh: "3托",
    qtyJa: "3パレット",
    target: "L2-P01",
  },
];

const TASKS: PlanImportTask[] = [
  { id: "TASK-001", planId: "PLAN-001", typeZh: "线边送料", typeJa: "ラインサイド納品" },
  { id: "TASK-002", planId: "PLAN-002", typeZh: "线边送料", typeJa: "ラインサイド納品" },
  { id: "TASK-003", planId: "PLAN-003", typeZh: "线边送料", typeJa: "ラインサイド納品" },
];

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

function derivePlanImportState(currentStep: DemoStep): PlanImportDerivedState {
  const generatedCount = currentStep >= 7 ? 3 : currentStep >= 6 ? 3 : currentStep >= 5 ? 2 : currentStep >= 4 ? 1 : 0;
  const activeIndex = currentStep >= 4 && currentStep <= 6 ? currentStep - 4 : undefined;

  return {
    activeStage: activeStageForStep(currentStep),
    checks: [
      { key: "planImport", state: "ok" },
      { key: "fieldParse", state: currentStep >= 2 ? "ok" : "waiting" },
      { key: "targetIdentify", state: currentStep >= 3 ? "ok" : "waiting" },
      { key: "taskGenerate", state: currentStep >= 6 ? "ok" : currentStep >= 4 ? "waiting" : "hold" },
    ],
    rowStatuses: PLAN_ROWS.reduce<Record<string, PlanImportDerivedState["rowStatuses"][string]>>((result, row, index) => {
      const isGenerated = index < generatedCount;
      const isActive = activeIndex === index;
      result[row.id] = isGenerated ? "generated" : currentStep === 2 || currentStep === 3 || isActive ? "parsing" : "unparsed";
      return result;
    }, {}),
    taskStatuses: TASKS.reduce<Record<string, PlanImportDerivedState["taskStatuses"][string]>>((result, task, index) => {
      if (index < generatedCount) {
        result[task.id] = "pending";
      } else if (activeIndex === index) {
        result[task.id] = "generated";
      } else {
        result[task.id] = "notGenerated";
      }
      return result;
    }, {}),
    activeRowId: activeIndex === undefined ? undefined : PLAN_ROWS[activeIndex]?.id,
    activeTaskId: activeIndex === undefined ? undefined : TASKS[activeIndex]?.id,
    fieldHighlight: currentStep === 2,
    targetHighlight: currentStep === 3,
    generatedCount,
    configActive: currentStep >= 2,
    nextStepActive: currentStep >= 7,
  };
}

interface PlanImportDemoProps {
  onHome?: () => void;
}

export default function PlanImportDemo({ onHome }: PlanImportDemoProps) {
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

  const t = planImportDictionaries[language];
  const antLocale = language === "zh" ? zhCN : jaJP;
  const derivedState = useMemo(() => derivePlanImportState(currentStep), [currentStep]);
  const shellClassName = [
    "demo-shell",
    "plan-import-shell",
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
          <PlanExcelTable currentStep={currentStep} language={language} plans={PLAN_ROWS} state={derivedState} t={t} />
          <GeneratedTaskPanel currentStep={currentStep} language={language} plans={PLAN_ROWS} tasks={TASKS} state={derivedState} t={t} />
        </main>
        <SubtitleAndLogPanel currentStep={currentStep} logs={logs} subtitleEnabled={subtitleEnabled} t={t} />
      </div>
    </ConfigProvider>
  );
}
