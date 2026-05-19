import { AimOutlined, CarOutlined, FileTextOutlined, InboxOutlined, RocketOutlined } from "@ant-design/icons";
import type { DemoStep, SmallLineDerivedState, SmallLinePointStatus, TranslationDict } from "../types";

interface PhysicalSceneSmallLineProps {
  currentStep: DemoStep;
  state: SmallLineDerivedState;
  t: TranslationDict;
}

interface ScenePointProps {
  className: string;
  id: string;
  role: string;
  title: string;
  status: string;
  tone: "alert" | "ok" | "hold" | "neutral" | "processing";
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

function linePointText(status: SmallLinePointStatus, t: TranslationDict) {
  if (status === "receiving") return t.points.receiving;
  if (status === "delivered") return t.points.delivered;
  if (status === "emptyPalletWaiting") return t.points.emptyPalletWaiting;
  if (status === "available") return t.points.available;
  return t.points.empty;
}

function linePointTone(status: SmallLinePointStatus) {
  if (status === "delivered" || status === "available") return "ok";
  if (status === "receiving") return "processing";
  if (status === "emptyPalletWaiting") return "hold";
  return "neutral";
}

function hintForStep(currentStep: DemoStep, state: SmallLineDerivedState, t: TranslationDict) {
  if (currentStep === 1) return t.scene.noUpperSystem;
  if (currentStep === 2) return t.scene.deliveryRouteReady;
  if (currentStep === 3) return t.status.ok;
  if (currentStep === 4) return t.scene.deliveryRouteRunning;
  if (currentStep === 5) return t.scene.deliveryRouteDone;
  if (currentStep === 6) return t.scene.returnRouteRunning;
  return state.isClosed ? t.scene.flowClosed : t.scene.returnRouteDone;
}

export default function PhysicalSceneSmallLine({ currentStep, state, t }: PhysicalSceneSmallLineProps) {
  const planStatusText = state.planStatus === "triggered" ? t.plan.statusTriggered : t.plan.statusImported;
  const lineStatusText = linePointText(state.linePointStatus, t);
  const deliveryBadge =
    state.deliveryRoute === "complete" ? t.scene.deliveryRouteDone : state.deliveryRoute === "active" ? t.scene.deliveryRouteRunning : t.scene.deliveryRouteReady;
  const returnBadge = state.returnRoute === "complete" ? t.scene.returnRouteDone : t.scene.returnRouteRunning;

  return (
    <section className="panel physical-panel small-line-panel">
      <div className="panel-head">
        <h2>{t.panels.physicalScene}</h2>
        <span>{hintForStep(currentStep, state, t)}</span>
      </div>

      <div className={`scene-canvas small-line-canvas step-${currentStep}`}>
        <svg className="route-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="small-arrow-hold" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#64748b" />
            </marker>
            <marker id="small-arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6" />
            </marker>
            <marker id="small-arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#22c55e" />
            </marker>
          </defs>
          <path
            className={`route-line delivery-route ${state.deliveryRoute}`}
            d="M225 372 C350 348 520 260 760 168"
            markerEnd={
              state.deliveryRoute === "complete"
                ? "url(#small-arrow-green)"
                : state.deliveryRoute === "active"
                  ? "url(#small-arrow-blue)"
                  : "url(#small-arrow-hold)"
            }
          />
          <path
            className={`route-line small-return-route ${state.returnRoute}`}
            d="M785 215 C750 310 685 375 580 420"
            markerEnd={state.returnRoute === "complete" ? "url(#small-arrow-green)" : "url(#small-arrow-blue)"}
          />
        </svg>

        <article className={`plan-card ${currentStep <= 2 ? "active" : ""}`}>
          <div className="plan-card-head">
            <span>
              <FileTextOutlined />
              {t.plan.title}
            </span>
            <em>{planStatusText}</em>
          </div>
          <div className="plan-grid">
            <div>
              <small>{t.plan.time}</small>
              <strong>09:00</strong>
            </div>
            <div>
              <small>{t.plan.line}</small>
              <strong>L1</strong>
            </div>
            <div>
              <small>{t.plan.product}</small>
              <strong>SKU-A</strong>
            </div>
            <div>
              <small>{t.plan.material}</small>
              <strong>{t.plan.materialValue}</strong>
            </div>
            <div>
              <small>{t.plan.qty}</small>
              <strong>{t.plan.qtyValue}</strong>
            </div>
            <div>
              <small>{t.plan.target}</small>
              <strong>L1-P01</strong>
            </div>
          </div>
        </article>

        <div className={`route-badge delivery-badge ${state.deliveryRoute === "complete" ? "ok" : state.deliveryRoute === "active" ? "processing" : "hold"}`}>
          {deliveryBadge}
        </div>
        <div className={`route-badge return-badge ${state.returnRoute === "hidden" ? "hidden" : ""} ${state.returnRoute === "complete" ? "ok" : "processing"}`}>
          {returnBadge}
        </div>

        <ScenePoint
          className="small-point-material"
          id="MAT-AREA-01"
          role={t.scene.materialAreaRole}
          title={t.scene.materialAreaTitle}
          status={state.showMaterialAtSource ? t.scene.bottlePallet : t.status.completed}
          tone={state.deliveryRoute === "active" ? "processing" : state.showMaterialAtSource ? "hold" : "ok"}
          icon={<InboxOutlined />}
          active={currentStep === 1 || currentStep === 4}
        />
        <ScenePoint
          className="small-point-supply"
          id="SUPPLY-01"
          role={t.scene.supplyRole}
          title={t.scene.supplyTitle}
          status={t.points.available}
          tone="neutral"
          icon={<RocketOutlined />}
        />
        <ScenePoint
          className="small-point-line"
          id="L1-P01"
          role={t.scene.linePointRole}
          title={t.scene.linePointTitle}
          status={lineStatusText}
          tone={linePointTone(state.linePointStatus)}
          icon={<AimOutlined />}
          active={currentStep === 3 || currentStep === 5 || currentStep === 6 || currentStep === 7}
        />
        <ScenePoint
          className="small-point-return"
          id="RET-AREA-01"
          role={t.scene.returnRole}
          title={t.scene.returnTitle}
          status={state.returnRoute === "complete" ? t.scene.returnRouteDone : t.scene.returnRoute}
          tone={state.returnRoute === "complete" ? "ok" : state.returnRoute === "active" ? "processing" : "neutral"}
          icon={<AimOutlined />}
          active={currentStep === 6 || currentStep === 7}
        />

        {state.showMaterialAtSource ? (
          <div className="pallet material-pallet source-material">
            <span />
            <strong>{t.scene.bottlePallet}</strong>
          </div>
        ) : null}

        {state.showMaterialAtLine ? (
          <div className="pallet material-pallet line-material">
            <span />
            <strong>{t.scene.bottlePallet}</strong>
          </div>
        ) : null}

        {state.showEmptyPalletAtLine ? (
          <div className="pallet empty-pallet line-empty-pallet">
            <span />
            <strong>{t.scene.emptyPallet}</strong>
          </div>
        ) : null}

        {state.showAgv ? (
          <div className={`agv-unit small-agv agv-${state.agvStatus}`}>
            <CarOutlined />
            <span>
              {t.scene.agv}
              <br />
              {t.agvStatus[state.agvStatus]}
            </span>
            {state.agvStatus === "delivering" || state.agvStatus === "returning" ? <i /> : null}
          </div>
        ) : null}

        {state.isClosed ? <div className="closed-banner">{t.scene.flowClosed}</div> : null}
      </div>
    </section>
  );
}
