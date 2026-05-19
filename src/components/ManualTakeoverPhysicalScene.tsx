import { AlertOutlined, CarOutlined, CloudServerOutlined, InboxOutlined, NodeIndexOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import type { DemoStep, ManualTakeoverDerivedState, RouteState } from "../types";
import type { ManualTakeoverTranslationDict } from "../manualTakeoverI18n";

interface ManualTakeoverPhysicalSceneProps {
  currentStep: DemoStep;
  state: ManualTakeoverDerivedState;
  t: ManualTakeoverTranslationDict;
}

interface ManualPointProps {
  className: string;
  id: string;
  role: string;
  status: string;
  tone: "alert" | "ok" | "hold" | "neutral" | "processing";
  icon: React.ReactNode;
  active?: boolean;
}

function ManualPoint({ className, id, role, status, tone, icon, active }: ManualPointProps) {
  return (
    <div className={`scene-point manual-point ${className} tone-${tone} ${active ? "active" : ""}`}>
      <div className="point-meta">
        {icon}
        <span>{role}</span>
      </div>
      <strong>{id}</strong>
      <small>{role}</small>
      <em>{status}</em>
    </div>
  );
}

function routeTone(route: RouteState) {
  if (route === "complete" || route === "allowed") return "ok";
  if (route === "active") return "processing";
  return "hold";
}

function stepHint(currentStep: DemoStep, t: ManualTakeoverTranslationDict) {
  if (currentStep === 1) return t.scene.inconsistencyHint;
  if (currentStep === 2) return t.scene.rcsHoldHint;
  if (currentStep === 3) return t.manual.newRoute;
  if (currentStep === 4) return t.scene.recoveryCreatedHint;
  if (currentStep === 5) return t.scene.recoveryDoneHint;
  if (currentStep === 6) return t.manual.rcsResendOk;
  return t.scene.nextAllowedHint;
}

export default function ManualTakeoverPhysicalScene({ currentStep, state, t }: ManualTakeoverPhysicalSceneProps) {
  const originalPointTone = state.pointReleased ? "ok" : "alert";
  const exceptionTone = state.exceptionStatus === "closed" ? "ok" : state.exceptionStatus === "processing" ? "processing" : "alert";

  return (
    <section className="panel physical-panel manual-physical-panel">
      <div className="panel-head">
        <h2>{t.panels.physicalScene}</h2>
        <span>{stepHint(currentStep, t)}</span>
      </div>

      <div className={`scene-canvas manual-canvas manual-step-${currentStep}`}>
        <svg className="route-svg manual-route-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="manual-arrow-hold" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#64748b" />
            </marker>
            <marker id="manual-arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6" />
            </marker>
            <marker id="manual-arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#22c55e" />
            </marker>
          </defs>
          <path className={`route-line manual-original-route ${state.originalRoute}`} d="M165 150 C350 100 610 95 835 145" markerEnd="url(#manual-arrow-hold)" />
          <path
            className={`route-line manual-buffer-route ${state.bufferRoute}`}
            d="M170 250 C310 360 480 395 615 355"
            markerEnd={state.bufferRoute === "complete" ? "url(#manual-arrow-green)" : state.bufferRoute === "active" ? "url(#manual-arrow-blue)" : "url(#manual-arrow-hold)"}
          />
          <path
            className={`route-line manual-rcs-route ${state.rcsRoute}`}
            d="M640 300 C720 250 790 230 870 255"
            markerEnd={state.rcsRoute === "complete" ? "url(#manual-arrow-green)" : state.rcsRoute === "active" ? "url(#manual-arrow-blue)" : "url(#manual-arrow-hold)"}
          />
        </svg>

        <div className={`route-badge manual-original-badge ${routeTone(state.originalRoute)}`}>{t.manual.originalRoute}</div>
        <div className={`route-badge manual-buffer-badge ${routeTone(state.bufferRoute)}`}>{t.manual.bufferRoute}</div>
        <div className={`route-badge manual-new-badge ${routeTone(state.rcsRoute)}`}>{state.rcsRoute === "active" ? t.scene.deliveryRouteRunning : state.rcsRoute === "complete" ? t.scene.deliveryRouteDone : t.manual.newRoute}</div>

        <ManualPoint
          className="manual-point-out"
          id="OUT-03"
          role={t.manual.sourceRole}
          status={state.showCargoAtOut ? t.plan.statusImported : t.points.empty}
          tone={state.showCargoAtOut ? "processing" : "ok"}
          icon={<CloudServerOutlined />}
          active={currentStep === 1 || currentStep === 4}
        />
        <ManualPoint
          className="manual-point-original"
          id="L2-P03"
          role={t.manual.originalRole}
          status={state.pointReleased ? t.manual.statusLabels.released : t.points.waitingRecovery}
          tone={originalPointTone}
          icon={<NodeIndexOutlined />}
          active={currentStep === 2}
        />
        <ManualPoint
          className="manual-point-buffer"
          id="BUF-01"
          role={t.manual.bufferRole}
          status={state.showCargoAtBuffer ? t.status.completed : t.points.available}
          tone={state.showCargoAtBuffer ? "ok" : "hold"}
          icon={<InboxOutlined />}
          active={currentStep === 4 || currentStep === 5}
        />
        <ManualPoint
          className="manual-point-new"
          id="L2-P07"
          role={t.manual.newTargetRole}
          status={state.destinationChanged ? t.manual.statusLabels.changed : t.status.waiting}
          tone={state.destinationChanged ? "ok" : "neutral"}
          icon={<SendOutlined />}
          active={currentStep === 3 || currentStep === 6}
        />

        <div className={`manual-exception-card status-${state.exceptionStatus}`}>
          <AlertOutlined />
          <strong>EX-06</strong>
          <span>{t.manual.statusLabels[state.exceptionStatus]}</span>
        </div>

        <div className={`manual-operator-card ${currentStep >= 2 ? "active" : ""}`}>
          <UserOutlined />
          <strong>admin</strong>
          <span>{t.manual.operatorRole}</span>
        </div>

        {state.showCargoAtOut ? (
          <div className="pallet manual-cargo manual-cargo-out">
            <span />
            <strong>{t.manual.cargo}</strong>
          </div>
        ) : null}
        {state.showCargoAtBuffer ? (
          <div className="pallet manual-cargo manual-cargo-buffer">
            <span />
            <strong>BUF-01</strong>
          </div>
        ) : null}
        {state.showCargoAtNewTarget ? (
          <div className="pallet manual-cargo manual-cargo-new">
            <span />
            <strong>L2-P07</strong>
          </div>
        ) : null}

        <div className={`agv-unit manual-agv agv-${state.agvStatus}`}>
          <CarOutlined />
          <span>{state.agvStatus === "standby" ? t.agvStatus.standby : state.agvStatus === "paused" ? t.points.emptyPalletWaiting : state.agvStatus === "buffering" ? t.scene.returnRouteRunning : state.agvStatus === "delivering" ? t.scene.deliveryRouteRunning : t.status.completed}</span>
          {state.agvStatus === "buffering" || state.agvStatus === "delivering" ? <i /> : null}
        </div>

        {state.isClosed ? (
          <div className="closed-banner manual-value-banner">
            <strong>{t.manual.valueTitle}</strong>
            <span>{t.manual.valueDesc}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
