import { AimOutlined, CarOutlined, CheckCircleFilled, DatabaseOutlined, FlagOutlined, NodeIndexOutlined } from "@ant-design/icons";
import type { DemoStep, PointMapNode, PointStatus, PointStatusMapState } from "../types";
import type { PointStatusTranslationDict } from "../pointStatusI18n";
import StatusPill from "./StatusPill";

interface PointStatusPanelProps {
  currentStep: DemoStep;
  state: PointStatusMapState;
  t: PointStatusTranslationDict;
}

const statOrder: PointStatus[] = ["empty", "occupied", "reserved", "waitingReturn", "exception", "receivable", "notReceivable"];

function actionForStep(currentStep: DemoStep, t: PointStatusTranslationDict) {
  if (currentStep === 1) return t.pointMap.actionGlobal;
  if (currentStep === 2) return t.pointMap.actionOut;
  if (currentStep === 3) return t.pointMap.actionReceivable;
  if (currentStep === 4) return t.pointMap.actionReserve;
  if (currentStep === 5) return t.pointMap.actionRunning;
  if (currentStep === 6) return t.pointMap.actionCompleted;
  return t.pointMap.actionException;
}

function isReceivable(point: PointMapNode) {
  return point.status === "receivable" || point.status === "reserved";
}

export default function PointStatusPanel({ currentStep, state, t }: PointStatusPanelProps) {
  const selectedPoint = state.points.find((point) => point.id === state.selectedPointId) ?? state.points[0];
  const taskActive = currentStep >= 3 && currentStep <= 6;
  const detailActive = currentStep >= 2;

  return (
    <section className="panel system-panel point-status-system-panel">
      <div className="panel-head">
        <h2>{t.pointMap.systemTitle}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <section className="point-stat-section">
        <div className="point-section-head">
          <DatabaseOutlined />
          <strong>{t.pointMap.statisticsTitle}</strong>
        </div>
        <div className="point-stat-grid">
          {statOrder.map((status) => (
            <div className={`point-stat-card status-${status} ${state.activeStatuses.includes(status) ? "active" : ""}`} key={status}>
              <span>{t.pointStatuses[status]}</span>
              <strong>{state.stats[status] ?? 0}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="point-task-detail-stack">
        <article className={`point-task-card ${taskActive ? "active" : ""} ${state.taskStatus === "notGenerated" ? "dimmed" : ""} ${state.taskStatus === "completed" ? "completed" : ""}`}>
          <div className="point-task-head">
            <h3>
              <span>TASK-MAP-001</span>
              <strong>{t.pointMap.taskType}</strong>
            </h3>
            <StatusPill state={state.taskStatus} label={t.status[state.taskStatus]} />
          </div>
          <div className="point-task-route">
            <span>OUT-01</span>
            <b>→</b>
            <span>L1-P01</span>
          </div>
          <div className="point-task-meta">
            <span>
              <CarOutlined />
              {t.pointMap.vehicle}: AGV-01
            </span>
            <span>
              <FlagOutlined />
              {t.tasks.status}: {t.status[state.taskStatus]}
            </span>
          </div>
          {state.taskStatus === "completed" ? (
            <div className="task-complete-mark">
              <CheckCircleFilled />
            </div>
          ) : null}
        </article>

        <article className={`point-detail-card ${detailActive ? "active" : ""}`}>
          <div className="point-section-head">
            <AimOutlined />
            <strong>{t.pointMap.detailTitle}</strong>
          </div>
          <div className="point-detail-grid">
            <div>
              <span>{t.pointMap.detailPointId}</span>
              <strong>{selectedPoint.id}</strong>
            </div>
            <div>
              <span>{t.pointMap.detailPointType}</span>
              <strong>{t.pointTypes[selectedPoint.type]}</strong>
            </div>
            <div>
              <span>{t.pointMap.detailStatus}</span>
              <strong>{t.pointStatuses[selectedPoint.status]}</strong>
            </div>
            <div>
              <span>{t.pointMap.detailReceivable}</span>
              <strong>{isReceivable(selectedPoint) ? t.pointMap.yes : t.pointMap.no}</strong>
            </div>
            <div>
              <span>{t.pointMap.detailReserved}</span>
              <strong>{selectedPoint.status === "reserved" ? t.pointMap.yes : t.pointMap.no}</strong>
            </div>
            <div>
              <span>{t.pointMap.detailAction}</span>
              <strong>{actionForStep(currentStep, t)}</strong>
            </div>
          </div>
        </article>
      </section>

      <div className="point-panel-note">
        <NodeIndexOutlined />
        <span>{t.pointMap.positioning}</span>
      </div>
    </section>
  );
}
