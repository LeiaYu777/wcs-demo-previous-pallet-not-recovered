import { AimOutlined, BarcodeOutlined, CarOutlined, CloudServerOutlined, InboxOutlined } from "@ant-design/icons";
import type { AsrsLineDerivedState, DemoStep } from "../types";
import type { AsrsLineTranslationDict } from "../asrsLineI18n";

interface AsrsLinePhysicalSceneProps {
  currentStep: DemoStep;
  state: AsrsLineDerivedState;
  t: AsrsLineTranslationDict;
}

interface AsrsPointProps {
  className: string;
  id: string;
  role: string;
  title: string;
  status: string;
  tone: "alert" | "ok" | "hold" | "neutral" | "processing";
  icon: React.ReactNode;
  active?: boolean;
}

function AsrsPoint({ className, id, role, title, status, tone, icon, active }: AsrsPointProps) {
  return (
    <div className={`scene-point asrs-point ${className} tone-${tone} ${active ? "active" : ""}`}>
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

function routeTone(route: AsrsLineDerivedState["deliveryRoute"]) {
  if (route === "complete" || route === "allowed") return "ok";
  if (route === "active") return "processing";
  return "hold";
}

function stepHint(currentStep: DemoStep, t: AsrsLineTranslationDict) {
  if (currentStep === 1) return t.scene.inconsistencyHint;
  if (currentStep === 2) return t.asrs.inspectOk;
  if (currentStep === 3) return t.asrs.targetReceivable;
  if (currentStep === 4) return t.scene.recoveryCreatedHint;
  if (currentStep === 5) return t.scene.recoveryDoneHint;
  if (currentStep === 6) return t.asrs.strategyTitle;
  return t.scene.nextAllowedHint;
}

export default function AsrsLinePhysicalScene({ currentStep, state, t }: AsrsLinePhysicalSceneProps) {
  return (
    <section className="panel physical-panel asrs-physical-panel">
      <div className="panel-head">
        <h2>{t.panels.physicalScene}</h2>
        <span>{stepHint(currentStep, t)}</span>
      </div>

      <div className={`scene-canvas asrs-canvas asrs-step-${currentStep}`}>
        <svg className="route-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="asrs-arrow-hold" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#64748b" />
            </marker>
            <marker id="asrs-arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6" />
            </marker>
            <marker id="asrs-arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#22c55e" />
            </marker>
          </defs>
          <path
            className={`route-line asrs-out-inspect-route ${state.outInspectRoute}`}
            d="M155 260 C230 245 310 245 390 260"
            markerEnd={state.outInspectRoute === "complete" ? "url(#asrs-arrow-green)" : "url(#asrs-arrow-blue)"}
          />
          <path
            className={`route-line asrs-delivery-route ${state.deliveryRoute}`}
            d="M465 250 C590 180 730 145 870 170"
            markerEnd={state.deliveryRoute === "complete" || state.deliveryRoute === "active" ? "url(#asrs-arrow-green)" : "url(#asrs-arrow-hold)"}
          />
          <path
            className={`route-line asrs-buffer-route ${state.bufferRoute}`}
            d="M465 310 C560 380 625 415 710 420"
            markerEnd={state.bufferRoute === "active" ? "url(#asrs-arrow-blue)" : "url(#asrs-arrow-hold)"}
          />
        </svg>

        <div className={`route-badge asrs-out-badge ${state.outInspectRoute === "complete" ? "ok" : "processing"}`}>
          {t.asrs.outInspectRoute}
        </div>
        <div className={`route-badge asrs-delivery-badge ${routeTone(state.deliveryRoute)}`}>
          {state.deliveryRoute === "active" ? t.scene.deliveryRouteRunning : state.deliveryRoute === "complete" ? t.scene.deliveryRouteDone : t.scene.nextRouteHold}
        </div>
        <div className={`route-badge asrs-buffer-badge ${state.bufferRoute === "active" ? "processing" : "hold"}`}>
          {t.asrs.bufferRoute}
        </div>

        <AsrsPoint
          className="asrs-point-out"
          id="ASRS-OUT-01"
          role={t.asrs.outRole}
          title={t.asrs.outTitle}
          status={state.outStatus === "released" ? t.points.empty : t.plan.statusImported}
          tone={state.outStatus === "released" ? "ok" : "processing"}
          icon={<CloudServerOutlined />}
          active={currentStep === 1}
        />
        <AsrsPoint
          className="asrs-point-inspect"
          id="INSPECT-01"
          role={t.asrs.inspectRole}
          title={t.asrs.inspectTitle}
          status={state.inspectStatus === "confirmed" ? t.asrs.inspectOk : t.status.waiting}
          tone={state.inspectStatus === "confirmed" ? "ok" : "hold"}
          icon={<BarcodeOutlined />}
          active={currentStep === 2}
        />
        <AsrsPoint
          className="asrs-point-buffer"
          id="BUF-01"
          role={t.asrs.bufferRole}
          title={t.asrs.bufferTitle}
          status={state.bufferStatus === "option" ? t.asrs.strategyBufferTitle : t.status.waiting}
          tone={state.bufferStatus === "option" ? "hold" : "neutral"}
          icon={<InboxOutlined />}
          active={currentStep === 6}
        />
        <AsrsPoint
          className="asrs-point-target"
          id="L1-P03"
          role={t.asrs.targetRole}
          title={t.asrs.targetTitle}
          status={state.targetStatus === "delivered" ? t.asrs.delivered : state.targetStatus === "available" ? t.asrs.targetReceivable : t.status.waiting}
          tone={state.targetStatus === "delivered" || state.targetStatus === "available" ? "ok" : "hold"}
          icon={<AimOutlined />}
          active={currentStep === 3 || currentStep === 5}
        />

        {state.showPalletAtOut ? (
          <div className="pallet asrs-cargo asrs-cargo-out">
            <span />
            <strong>{t.asrs.cargo}</strong>
          </div>
        ) : null}
        {state.showPalletAtInspect ? (
          <div className="pallet asrs-cargo asrs-cargo-inspect">
            <span />
            <strong>{t.asrs.cargo}</strong>
          </div>
        ) : null}
        {state.showPalletAtTarget ? (
          <div className="pallet asrs-cargo asrs-cargo-target">
            <span />
            <strong>{t.asrs.cargo}</strong>
          </div>
        ) : null}

        <div className={`agv-unit asrs-agv agv-${state.agvStatus}`}>
          <CarOutlined />
          <span>{t.asrsAgvStatus[state.agvStatus]}</span>
          {state.agvStatus === "running" ? <i /> : null}
        </div>

        {state.showStrategyBoard ? (
          <div className="asrs-strategy-board">
            <strong>{t.asrs.strategyTitle}</strong>
            <span>{t.asrs.strategyWaitTitle}</span>
            <span>{t.asrs.strategyBufferTitle}</span>
            <span>{t.asrs.strategyAlertTitle}</span>
          </div>
        ) : null}

        {state.isClosed ? (
          <div className="closed-banner asrs-value-banner">
            <strong>{t.asrs.valueTitle}</strong>
            <span>{t.asrs.valueDesc}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
