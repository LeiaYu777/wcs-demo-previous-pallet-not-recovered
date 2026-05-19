import { ApartmentOutlined, CarOutlined, CloudServerOutlined, InboxOutlined, NodeIndexOutlined, WarningOutlined } from "@ant-design/icons";
import type { DemoStep, PointMapNode, PointStatus, PointStatusMapState, PointType, RouteState } from "../types";
import type { PointStatusTranslationDict } from "../pointStatusI18n";

interface PointMapSceneProps {
  currentStep: DemoStep;
  state: PointStatusMapState;
  t: PointStatusTranslationDict;
}

const statusOrder: PointStatus[] = ["empty", "occupied", "reserved", "waitingReturn", "exception", "receivable", "notReceivable"];

const pointIcons: Record<PointType, React.ReactNode> = {
  asrsExit: <CloudServerOutlined />,
  preBuffer: <ApartmentOutlined />,
  lineSide: <NodeIndexOutlined />,
  buffer: <InboxOutlined />,
  exceptionPoint: <WarningOutlined />,
};

function routeTone(routeState: RouteState) {
  if (routeState === "complete") return "ok";
  if (routeState === "active") return "processing";
  if (routeState === "allowed") return "ok";
  return "hold";
}

function pointClass(id: string) {
  return `point-node-${id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function PointNode({ point, active, t }: { point: PointMapNode; active: boolean; t: PointStatusTranslationDict }) {
  return (
    <div className={`point-map-node ${pointClass(point.id)} status-${point.status} ${active ? "active" : ""}`}>
      <div className="point-map-node-meta">
        {pointIcons[point.type]}
        <span>{t.pointTypes[point.type]}</span>
      </div>
      <strong>{point.id}</strong>
      <em>{t.pointStatuses[point.status]}</em>
      {point.material || point.task ? <small>{point.material ?? point.task}</small> : null}
    </div>
  );
}

export default function PointMapScene({ currentStep, state, t }: PointMapSceneProps) {
  const selectedPoint = state.points.find((point) => point.id === state.selectedPointId);

  return (
    <section className="panel physical-panel point-map-panel">
      <div className="panel-head">
        <h2>{t.pointMap.mapTitle}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <div className={`scene-canvas point-map-canvas point-map-step-${currentStep}`}>
        <svg className="route-svg point-route-svg" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="point-arrow-hold" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#64748b" />
            </marker>
            <marker id="point-arrow-blue" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#3b82f6" />
            </marker>
            <marker id="point-arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10 Z" fill="#22c55e" />
            </marker>
          </defs>
          <path
            className={`route-line point-main-route ${state.routeState}`}
            d="M145 158 C260 115 480 110 720 134"
            markerEnd={state.routeState === "complete" ? "url(#point-arrow-green)" : state.routeState === "active" ? "url(#point-arrow-blue)" : "url(#point-arrow-hold)"}
          />
          <path className="route-line point-pre-route allowed" d="M180 352 C310 365 410 330 500 265" markerEnd="url(#point-arrow-green)" />
          <path
            className={`route-line point-exception-route ${state.showExceptionFocus ? "active" : "blocked"}`}
            d="M740 300 C815 350 860 388 910 430"
            markerEnd={state.showExceptionFocus ? "url(#point-arrow-blue)" : "url(#point-arrow-hold)"}
          />
        </svg>

        <div className={`route-badge point-main-badge ${routeTone(state.routeState)}`}>
          {state.routeState === "active" ? t.scene.deliveryRouteRunning : state.routeState === "complete" ? t.scene.deliveryRouteDone : t.scene.nextRouteHold}
        </div>
        <div className={`route-badge point-exception-badge ${state.showExceptionFocus ? "processing" : "hold"}`}>{t.scene.returnRoute}</div>

        <div className="point-map-legend">
          <strong>{t.pointMap.legendTitle}</strong>
          <div>
            {statusOrder.map((status) => (
              <span className={`legend-status status-${status}`} key={status}>
                <i />
                {t.pointStatuses[status]}
              </span>
            ))}
          </div>
        </div>

        {state.points.map((point) => (
          <PointNode
            active={point.id === selectedPoint?.id || (state.showExceptionFocus && ["L2-P01", "EX-01", "BUF-01"].includes(point.id))}
            key={point.id}
            point={point}
            t={t}
          />
        ))}

        <div className={`agv-unit point-map-agv agv-${state.agvStatus}`}>
          <CarOutlined />
          <span>{state.agvStatus === "running" ? t.status.running : state.agvStatus === "completed" ? t.status.completed : state.agvStatus === "pending" ? t.status.pending : t.agvStatus.standby}</span>
          {state.agvStatus === "running" ? <i /> : null}
        </div>

        {currentStep >= 7 ? (
          <div className="point-value-banner">
            <strong>{t.scene.nextAllowedHint}</strong>
            <span>{t.pointMap.positioning}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
