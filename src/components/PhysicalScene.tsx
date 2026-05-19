import { AimOutlined, CarOutlined, InboxOutlined, RocketOutlined } from "@ant-design/icons";
import type { DemoDerivedState, DemoStep, TranslationDict } from "../types";

interface PhysicalSceneProps {
  currentStep: DemoStep;
  state: DemoDerivedState;
  t: TranslationDict;
}

interface ScenePointProps {
  className: string;
  id: string;
  role: string;
  title: string;
  status: string;
  tone: "alert" | "ok" | "hold" | "neutral";
  icon: React.ReactNode;
  active?: boolean;
}

function ScenePoint({ className, id, role, title, status, tone, icon, active }: ScenePointProps) {
  return (
    <div className={`scene-point ${className} tone-${tone} ${active ? "active" : ""}`}>
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

function stepHint(currentStep: DemoStep, state: DemoDerivedState, t: TranslationDict) {
  if (currentStep === 2) return t.scene.inconsistencyHint;
  if (currentStep === 3) return t.scene.rcsHoldHint;
  if (currentStep === 4) return t.scene.recoveryCreatedHint;
  if (currentStep === 5 && state.recoveryCompleted) return t.scene.recoveryDoneHint;
  if (currentStep === 6) return t.scene.nextAllowedHint;
  return t.scene.nextRouteHold;
}

export default function PhysicalScene({ currentStep, state, t }: PhysicalSceneProps) {
  const sourceStatus = state.l2p03Status === "empty" ? t.points.empty : t.points.waitingRecovery;
  const nextStatus = state.nextPointStatus === "allowed" ? t.points.allowedIn : t.points.waiting;

  return (
    <section className="panel physical-panel">
      <div className="panel-head">
        <h2>{t.panels.physicalScene}</h2>
        <span>{stepHint(currentStep, state, t)}</span>
      </div>

      <div className={`scene-canvas step-${currentStep}`}>
        <svg className="route-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="arrow-hold" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#64748b" />
            </marker>
            <marker id="arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#22c55e" />
            </marker>
          </defs>
          <path
            className={`route-line next-route ${state.nextRoute === "allowed" ? "allowed" : "blocked"}`}
            d="M145 390 C310 330 570 220 855 165"
            markerEnd={state.nextRoute === "allowed" ? "url(#arrow-green)" : "url(#arrow-hold)"}
          />
          <path
            className={`route-line recovery-route ${state.recoveryRoute}`}
            d="M405 210 C485 280 560 350 670 405"
            markerEnd={state.recoveryRoute === "complete" ? "url(#arrow-green)" : "url(#arrow-blue)"}
          />
        </svg>

        <div className={`route-badge next-badge ${state.nextRoute === "allowed" ? "ok" : "hold"}`}>
          {state.nextRoute === "allowed" ? t.scene.nextRouteAllowed : t.scene.nextRouteHold}
        </div>
        <div className={`route-badge recovery-badge ${state.recoveryRoute === "hidden" ? "hidden" : ""} ${state.recoveryRoute === "complete" ? "ok" : "processing"}`}>
          {t.scene.recoveryRoute}
        </div>

        <ScenePoint
          className="point-source"
          id="L2-P03"
          role={t.scene.sourceRole}
          title={t.scene.sourceTitle}
          status={sourceStatus}
          tone={state.l2p03Status === "empty" ? "ok" : "alert"}
          icon={<InboxOutlined />}
          active={currentStep === 1 || currentStep === 2 || currentStep === 5}
        />
        <ScenePoint
          className="point-return"
          id="RET-AREA-01"
          role={t.scene.returnRole}
          title={t.scene.returnTitle}
          status={t.scene.recoveryRoute}
          tone={state.recoveryRoute === "complete" ? "ok" : state.recoveryRoute === "hidden" ? "neutral" : "hold"}
          icon={<AimOutlined />}
          active={currentStep === 4 || currentStep === 5}
        />
        <ScenePoint
          className="point-asrs"
          id="ASRS-OUT-02"
          role={t.scene.asrsRole}
          title={t.scene.asrsTitle}
          status={state.nextDeliveryAllowed ? t.status.executable : t.status.hold}
          tone={state.nextDeliveryAllowed ? "ok" : "neutral"}
          icon={<RocketOutlined />}
        />
        <ScenePoint
          className="point-next"
          id="L2-P07"
          role={t.scene.nextRole}
          title={t.scene.nextTitle}
          status={nextStatus}
          tone={state.nextDeliveryAllowed ? "ok" : "hold"}
          icon={<AimOutlined />}
          active={currentStep === 6}
        />

        {state.showSourcePallet ? (
          <div className={`pallet source-pallet ${currentStep === 2 ? "alert" : ""}`}>
            <span />
            <strong>{t.scene.pallet}</strong>
          </div>
        ) : null}

        {state.showAgv ? (
          <div className={`agv-unit ${state.recoveryRunning ? "running" : ""} ${state.recoveryCompleted ? "done" : ""}`}>
            <CarOutlined />
            <span>{t.scene.agv}</span>
            {state.showMovingPallet ? <i /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
