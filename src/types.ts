export type Language = "zh" | "ja";

export type DemoStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StageId = 1 | 2 | 3;

export type CheckState = "ok" | "ng" | "hold" | "waiting";

export type CheckKey = "takt" | "previousRecovery" | "pointIdle" | "nextPermission";

export type AsrsLineCheckKey = "outArrival" | "inspectConfirm" | "targetReceivable" | "agvPermission";

export type TargetOccupiedCheckKey = "outArrival" | "cargoIdentity" | "targetReceivable" | "agvPermission";

export type PlanImportCheckKey = "planImport" | "fieldParse" | "targetIdentify" | "taskGenerate";

export type PlanRowStatus = "unparsed" | "parsing" | "generated";

export type PlanTaskStatus = "notGenerated" | "generated" | "pending";

export type ManualActionId =
  | "manualReleasePoint"
  | "manualChangeDestination"
  | "manualTransferBuffer"
  | "manualCancelTask"
  | "manualResendRcs"
  | "manualConfirmException";

export type ManualActionState = "idle" | "active" | "done";

export type ManualTaskStatus = "blocked" | "cancelled" | "notGenerated" | "running" | "completed" | "sent";

export type ManualExceptionStatus = "active" | "processing" | "closed";

export type PointStatus = "empty" | "occupied" | "reserved" | "waitingReturn" | "exception" | "receivable" | "notReceivable";

export type PointType = "asrsExit" | "preBuffer" | "lineSide" | "buffer" | "exceptionPoint";

export type TaskState = "notGenerated" | "pending" | "running" | "completed" | "hold" | "waitingPoint" | "executable";

export type PointState = "waitingRecovery" | "empty";

export type NextPointState = "waiting" | "allowed";

export type RouteState = "hidden" | "blocked" | "active" | "complete" | "allowed";

export type LogKey =
  | "taktDone"
  | "fieldStillWaiting"
  | "nextHeld"
  | "recoveryCreated"
  | "recoveryDone"
  | "nextAllowed"
  | "planImported"
  | "timeTriggered"
  | "linePointAllowed"
  | "deliveryCreated"
  | "deliveryCompleted"
  | "returnCreated"
  | "flowClosed"
  | "asrsOutArrived"
  | "asrsInspectDone"
  | "asrsTargetAllowed"
  | "asrsTaskCreated"
  | "asrsTaskRunning"
  | "asrsFallbackReady"
  | "asrsFlowComplete"
  | "pointMapLoaded"
  | "pointOutOccupied"
  | "pointTargetReceivable"
  | "pointTaskCreated"
  | "pointAgvRunning"
  | "pointTaskCompleted"
  | "pointExceptionShown"
  | "targetOutArrived"
  | "targetOccupiedFound"
  | "targetRcsHeld"
  | "targetWaitStarted"
  | "targetWaitTimeout"
  | "targetBufferRunning"
  | "targetAlarmCreated"
  | "planImportLoaded"
  | "planFieldsParsed"
  | "planTargetsIdentified"
  | "planTask001Created"
  | "planTask002Created"
  | "planTask003Created"
  | "planTasksReady"
  | "manualExceptionCreated"
  | "manualPointReleased"
  | "manualDestinationChanged"
  | "manualBufferStarted"
  | "manualOriginalCancelled"
  | "manualRcsResent"
  | "manualExceptionClosed";

export type SmallLineCheckKey = "planImport" | "timeCall" | "linePoint" | "deliveryPermission";

export type SmallLinePointStatus = "empty" | "receiving" | "delivered" | "emptyPalletWaiting" | "available";

export type SmallLinePlanStatus = "imported" | "triggered";

export type SmallLineAgvStatus = "standby" | "ready" | "pending" | "delivering" | "delivered" | "returning" | "returned";

export type AsrsLineAgvStatus = "standby" | "confirming" | "pending" | "running" | "delivered" | "strategy";

export type TargetOccupiedWaitStatus = "notStarted" | "waiting" | "timeout";

export type TargetOccupiedAlarmStatus = "notGenerated" | "created";

export type TargetOccupiedAgvStatus = "standby" | "held" | "waiting" | "buffering" | "completed";

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

export interface SmallLineCheckResult {
  key: SmallLineCheckKey;
  state: CheckState;
}

export interface AsrsLineCheckResult {
  key: AsrsLineCheckKey;
  state: CheckState;
}

export interface TargetOccupiedCheckResult {
  key: TargetOccupiedCheckKey;
  state: CheckState;
}

export interface PlanImportCheckResult {
  key: PlanImportCheckKey;
  state: CheckState;
}

export interface PlanImportRow {
  id: string;
  time: string;
  line: string;
  product: string;
  materialZh: string;
  materialJa: string;
  qtyZh: string;
  qtyJa: string;
  target: string;
}

export interface PlanImportTask {
  id: string;
  planId: string;
  typeZh: string;
  typeJa: string;
}

export interface ManualAuditLog {
  time: string;
  operator: string;
  actionId: ManualActionId;
  target: string;
  before: string;
  after: string;
  reason: string;
}

export interface PointMapNode {
  id: string;
  type: PointType;
  status: PointStatus;
  material?: string;
  task?: string;
}

export type PointAgvStatus = "standby" | "pending" | "running" | "completed";

export interface PointStatusMapState {
  activeStage: StageId;
  points: PointMapNode[];
  selectedPointId: string;
  taskStatus: TaskState;
  routeState: RouteState;
  agvStatus: PointAgvStatus;
  stats: Record<PointStatus, number>;
  activeStatuses: PointStatus[];
  showExceptionFocus: boolean;
}

export interface TargetOccupiedDerivedState {
  activeStage: StageId;
  checks: TargetOccupiedCheckResult[];
  outStatus: "arrived" | "released";
  targetStatus: "unchecked" | "occupied" | "notReceivable";
  bufferStatus: "empty" | "ready" | "buffering" | "buffered";
  agvStatus: TargetOccupiedAgvStatus;
  waitStatus: TargetOccupiedWaitStatus;
  waitProgress: number;
  waitCountdown: string;
  originalTaskStatus: TaskState;
  bufferTaskStatus: TaskState;
  alarmStatus: TargetOccupiedAlarmStatus;
  targetRoute: RouteState;
  bufferRoute: RouteState;
  showCargoAtOut: boolean;
  showCargoAtBuffer: boolean;
  showTargetOccupiedPallet: boolean;
  isClosed: boolean;
}

export interface PlanImportDerivedState {
  activeStage: StageId;
  checks: PlanImportCheckResult[];
  rowStatuses: Record<string, PlanRowStatus>;
  taskStatuses: Record<string, PlanTaskStatus>;
  activeRowId?: string;
  activeTaskId?: string;
  fieldHighlight: boolean;
  targetHighlight: boolean;
  generatedCount: number;
  configActive: boolean;
  nextStepActive: boolean;
}

export interface ManualTakeoverDerivedState {
  activeStage: StageId;
  exceptionStatus: ManualExceptionStatus;
  actionStates: Record<ManualActionId, ManualActionState>;
  originalTaskStatus: ManualTaskStatus;
  bufferTaskStatus: ManualTaskStatus;
  rcsTaskStatus: ManualTaskStatus;
  originalRoute: RouteState;
  bufferRoute: RouteState;
  rcsRoute: RouteState;
  pointReleased: boolean;
  destinationChanged: boolean;
  showCargoAtOut: boolean;
  showCargoAtBuffer: boolean;
  showCargoAtNewTarget: boolean;
  agvStatus: "standby" | "paused" | "buffering" | "delivering" | "completed";
  auditLogs: ManualAuditLog[];
  isClosed: boolean;
}

export interface SmallLineDerivedState {
  activeStage: StageId;
  planStatus: SmallLinePlanStatus;
  linePointStatus: SmallLinePointStatus;
  agvStatus: SmallLineAgvStatus;
  deliveryTaskStatus: TaskState;
  returnTaskStatus: TaskState;
  checks: SmallLineCheckResult[];
  deliveryRoute: RouteState;
  returnRoute: RouteState;
  showMaterialAtSource: boolean;
  showMaterialAtLine: boolean;
  showEmptyPalletAtLine: boolean;
  showAgv: boolean;
  isClosed: boolean;
}

export interface AsrsLineDerivedState {
  activeStage: StageId;
  outStatus: "arrived" | "released";
  inspectStatus: "waiting" | "confirmed";
  targetStatus: "waiting" | "available" | "delivered";
  bufferStatus: "standby" | "option";
  agvStatus: AsrsLineAgvStatus;
  deliveryTaskStatus: TaskState;
  checks: AsrsLineCheckResult[];
  outInspectRoute: RouteState;
  deliveryRoute: RouteState;
  bufferRoute: RouteState;
  showPalletAtOut: boolean;
  showPalletAtInspect: boolean;
  showPalletAtTarget: boolean;
  showStrategyBoard: boolean;
  isClosed: boolean;
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
    home: string;
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
    planCard: string;
    noUpperSystem: string;
    materialAreaRole: string;
    materialAreaTitle: string;
    supplyRole: string;
    supplyTitle: string;
    linePointRole: string;
    linePointTitle: string;
    bottlePallet: string;
    emptyPallet: string;
    deliveryRoute: string;
    returnRoute: string;
    deliveryRouteReady: string;
    deliveryRouteRunning: string;
    deliveryRouteDone: string;
    returnRouteRunning: string;
    returnRouteDone: string;
    flowClosed: string;
  };
  points: {
    waitingRecovery: string;
    empty: string;
    waiting: string;
    allowedIn: string;
    receiving: string;
    delivered: string;
    emptyPalletWaiting: string;
    available: string;
  };
  plan: {
    title: string;
    statusImported: string;
    statusTriggered: string;
    time: string;
    line: string;
    product: string;
    material: string;
    qty: string;
    target: string;
    materialValue: string;
    qtyValue: string;
  };
  smallChecks: Record<SmallLineCheckKey, string>;
  agvStatus: Record<SmallLineAgvStatus, string>;
  checks: Record<CheckKey, string>;
  status: Record<CheckState | TaskState, string>;
  tasks: {
    deliveryTitle: string;
    recoveryTitle: string;
    nextTitle: string;
    taskId: string;
    taskType: string;
    material: string;
    qty: string;
    from: string;
    to: string;
    status: string;
    deliveryType: string;
    recoveryType: string;
    nextType: string;
  };
  subtitles: Record<DemoStep, string>;
  logs: Record<string, string>;
  stepNotes: Record<DemoStep, string>;
}
