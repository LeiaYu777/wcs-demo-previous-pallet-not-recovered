export type Language = "zh" | "ja";

export type DemoStep = 1 | 2 | 3 | 4 | 5 | 6;

export type StageId = 1 | 2 | 3;

export type CheckState = "ok" | "ng" | "hold";

export type CheckKey = "takt" | "previousRecovery" | "pointIdle" | "nextPermission";

export type TaskState = "notGenerated" | "pending" | "running" | "completed" | "hold" | "waitingPoint" | "executable";

export type PointState = "waitingRecovery" | "empty";

export type NextPointState = "waiting" | "allowed";

export type RouteState = "hidden" | "blocked" | "active" | "complete" | "allowed";

export type LogKey = "taktDone" | "fieldStillWaiting" | "nextHeld" | "recoveryCreated" | "recoveryDone" | "nextAllowed";

export interface CheckResult {
  key: CheckKey;
  state: CheckState;
}

export interface DemoDerivedState {
  activeStage: StageId;
  l2p03Status: PointState;
  nextPointStatus: NextPointState;
  recoveryTaskStatus: TaskState;
  nextTaskStatus: TaskState;
  checks: CheckResult[];
  recoveryRoute: RouteState;
  nextRoute: RouteState;
  showAgv: boolean;
  showSourcePallet: boolean;
  showMovingPallet: boolean;
  recoveryRunning: boolean;
  recoveryCompleted: boolean;
  nextDeliveryAllowed: boolean;
}

export interface TranslationDict {
  app: {
    brand: string;
    title: string;
    subtitle: string;
    stepLabel: string;
    demoBadge: string;
  };
  controls: {
    languageZh: string;
    languageJa: string;
    start: string;
    pause: string;
    next: string;
    reset: string;
    loop: string;
    voice: string;
    subtitle: string;
  };
  stages: Record<StageId, { title: string; description: string }>;
  panels: {
    physicalScene: string;
    systemDecision: string;
    checks: string;
    subtitle: string;
    logs: string;
  };
  scene: {
    sourceRole: string;
    sourceTitle: string;
    returnRole: string;
    returnTitle: string;
    asrsRole: string;
    asrsTitle: string;
    nextRole: string;
    nextTitle: string;
    pallet: string;
    agv: string;
    recoveryRoute: string;
    nextRoute: string;
    nextRouteHold: string;
    nextRouteAllowed: string;
    inconsistencyHint: string;
    rcsHoldHint: string;
    recoveryCreatedHint: string;
    recoveryDoneHint: string;
    nextAllowedHint: string;
  };
  points: {
    waitingRecovery: string;
    empty: string;
    waiting: string;
    allowedIn: string;
  };
  checks: Record<CheckKey, string>;
  status: Record<CheckState | TaskState, string>;
  tasks: {
    recoveryTitle: string;
    nextTitle: string;
    taskId: string;
    taskType: string;
    from: string;
    to: string;
    status: string;
    recoveryType: string;
    nextType: string;
  };
  subtitles: Record<DemoStep, string>;
  logs: Record<LogKey, string>;
  stepNotes: Record<DemoStep, string>;
}
