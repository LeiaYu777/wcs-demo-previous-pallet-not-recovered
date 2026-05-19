import { AlertOutlined, CarOutlined, CloudServerOutlined, InboxOutlined, LockOutlined, NodeIndexOutlined } from "@ant-design/icons";
import type { DemoStep, RouteState, TargetOccupiedDerivedState } from "../types";
import type { TargetOccupiedTranslationDict } from "../targetOccupiedI18n";

interface TargetOccupiedPhysicalSceneProps {
  currentStep: DemoStep;
  state: TargetOccupiedDerivedState;
  t: TargetOccupiedTranslationDict;
}

interface TargetPointProps {
  className: string;
  id: string;
  role: string;
  title: string;
  status: string;
  tone: "alert" | "ok" | "hold" | "neutral" | "processing";
  icon: React.ReactNode;
  active?: boolean;
}

function TargetPoint({ className, id, role, title, status, tone, icon, active }: TargetPointProps) {
  return (
    <div className={`scene-point target-point ${className} tone-${tone} ${active ? "active" : ""}`}>
      <div className="point-meta">
        {icon}
        <span>{role}</span>
      </div>
      <strong>{id}</strong>
      <small>{title}</small>
      <em>{status}</em>
    </div>
  );
}

function routeTone(route: RouteState) {
  if (route === "complete" || route === "allowed") return "ok";
  if (route === "active") return "processing";
  return "hold";
}

function stepHint(currentStep: DemoStep, t: TargetOccupiedTranslationDict) {
  if (currentStep === 1) return t.scene.inconsistencyHint;
  if (currentStep === 2) return t.scene.nextRouteHold;
  if (currentStep === 3) return t.targetOccupied.rcsHold;
  if (currentStep === 4) return t.targetOccupied.waitChecking;
  if (currentStep === 5) return t.targetOccupied.waitTimeout;
  if (currentStep === 6) return t.scene.returnRouteRunning;
  return t.scene.nextAllowedHint;
}

export default function TargetOccupiedPhysicalScene({ currentStep, state, t }: TargetOccupiedPhysicalSceneProps) {
  return (
    <section className="panel physical-panel target-physical-panel">
      <div className="panel-head">
        <h2>{t.panels.physicalScene}</h2>
        <span>{stepHint(currentStep, t)}</span>
      </div>

      <div className={`scene-canvas target-canvas target-step-${currentStep}`}>
        <svg className="route-svg target-route-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="target-arrow-hold" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#64748b" />
            </marker>
            <marker id="target-arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6" />
            </marker>
            <marker id="target-arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#22c55e" />
            </marker>
          </defs>
          <path
            className={`route-line target-normal-route ${state.targetRoute}`}
            d="M170 170 C380 120 605 120 820 165"
            markerEnd={state.targetRoute === "active" ? "url(#target-arrow-blue)" : "url(#target-arrow-hold)"}
          />
          <path
            className={`route-line target-buffer-route ${state.bufferRoute}`}
            d="M170 250 C320 375 555 410 740 355"
            markerEnd={state.bufferRoute === "complete" ? "url(#target-arrow-green)" : state.bufferRoute === "active" ? "url(#target-arrow-blue)" : "url(#target-arrow-hold)"}
          />
        </svg>

        <div className={`route-badge target-normal-badge ${routeTone(state.targetRoute)}`}>
          {state.targetRoute === "blocked" ? t.targetOccupied.blockedRoute : t.scene.deliveryRoute}
        </div>
        <div className={`route-badge target-buffer-badge ${routeTone(state.bufferRoute)}`}>
          {state.bufferRoute === "active" ? t.scene.returnRouteRunning : state.bufferRoute === "complete" ? t.scene.returnRouteDone : t.targetOccupied.bufferRoute}
        </div>

        <TargetPoint
          className="target-point-out"
          id="OUT-02"
          role={t.targetOccupied.outRole}
          title={t.targetOccupied.outTitle}
          status={state.outStatus === "released" ? t.points.empty : t.targetOccupied.statusArrived}
          tone={state.outStatus === "released" ? "ok" : "processing"}
          icon={<CloudServerOutlined />}
          active={currentStep === 1 || currentStep === 5}
        />

        <TargetPoint
          className="target-point-line"
          id="L2-P03"
          role={t.targetOccupied.targetRole}
          title={t.targetOccupied.targetTitle}
          status={state.targetStatus === "unchecked" ? t.status.waiting : t.targetOccupied.statusNotReceivable}
          tone={state.targetStatus === "unchecked" ? "hold" : "alert"}
          icon={<NodeIndexOutlined />}
          active={currentStep >= 2 && currentStep <= 5}
        />

        <TargetPoint
          className="target-point-buffer"
          id="BUF-01"
          role={t.targetOccupied.bufferRole}
          title={t.targetOccupied.bufferTitle}
          status={state.bufferStatus === "buffered" ? t.targetOccupied.statusBuffered : state.bufferStatus === "buffering" ? t.targetOccupied.statusBuffering : t.points.allowedIn}
          tone={state.bufferStatus === "buffered" ? "ok" : state.bufferStatus === "buffering" ? "processing" : "ok"}
          icon={<InboxOutlined />}
          active={currentStep >= 5}
        />

        <div className={`target-alarm-card ${state.alarmStatus === "created" ? "active" : ""}`}>
          <AlertOutlined />
          <strong>ALM-004</strong>
          <span>{state.alarmStatus === "created" ? t.targetOccupied.statusAlarmed : t.targetAlarmStatus.notGenerated}</span>
        </div>

        {state.showCargoAtOut ? (
          <div className="pallet target-cargo target-cargo-out">
            <span />
            <strong>{t.targetOccupied.cargo}</strong>
          </div>
        ) : null}

        {state.showTargetOccupiedPallet ? (
          <div className="pallet target-occupied-pallet alert">
            <span />
            <strong>{t.targetOccupied.occupiedPallet}</strong>
          </div>
        ) : null}

        {state.showCargoAtBuffer ? (
          <div className="pallet target-cargo target-cargo-buffer">
            <span />
            <strong>{t.targetOccupied.statusBuffered}</strong>
          </div>
        ) : null}

        <div className={`agv-unit target-agv agv-${state.agvStatus}`}>
          <CarOutlined />
          <span>{t.targetAgvStatus[state.agvStatus]}</span>
          {state.agvStatus === "buffering" ? <i /> : null}
        </div>

        {currentStep >= 3 && currentStep <= 5 ? (
          <div className="target-rcs-hold-card">
            <LockOutlined />
            <strong>{t.targetOccupied.rcsHold}</strong>
            <span>{t.targetOccupied.positioning}</span>
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div className="target-countdown-card">
            <strong>{state.waitCountdown}</strong>
            <span>{t.targetOccupied.waitChecking}</span>
            <div>
              <i style={{ width: `${state.waitProgress}%` }} />
            </div>
          </div>
        ) : null}

        {state.isClosed ? (
          <div className="closed-banner target-value-banner">
            <strong>{t.targetOccupied.summaryTitle}</strong>
            <span>{t.targetOccupied.summaryDesc}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
