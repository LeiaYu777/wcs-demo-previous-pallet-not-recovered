import { AlertOutlined, BarcodeOutlined, CheckCircleFilled, ClockCircleOutlined, CloudServerOutlined, NodeIndexOutlined, SendOutlined } from "@ant-design/icons";
import type { DemoStep, TargetOccupiedCheckKey, TargetOccupiedDerivedState } from "../types";
import type { TargetOccupiedTranslationDict } from "../targetOccupiedI18n";
import StatusPill from "./StatusPill";

interface TargetOccupiedDecisionPanelProps {
  currentStep: DemoStep;
  state: TargetOccupiedDerivedState;
  t: TargetOccupiedTranslationDict;
}

const checkIcons: Record<TargetOccupiedCheckKey, React.ReactNode> = {
  outArrival: <CloudServerOutlined />,
  cargoIdentity: <BarcodeOutlined />,
  targetReceivable: <NodeIndexOutlined />,
  agvPermission: <SendOutlined />,
};

function activeCheckForStep(currentStep: DemoStep): TargetOccupiedCheckKey {
  if (currentStep === 1) return "outArrival";
  if (currentStep === 2) return "targetReceivable";
  if (currentStep === 3 || currentStep === 4) return "agvPermission";
  return "targetReceivable";
}

export default function TargetOccupiedDecisionPanel({ currentStep, state, t }: TargetOccupiedDecisionPanelProps) {
  const activeCheck = activeCheckForStep(currentStep);
  const waitActive = currentStep >= 4 && currentStep <= 5;
  const bufferActive = currentStep >= 5;
  const alarmActive = state.alarmStatus === "created";

  return (
    <section className="panel system-panel target-system-panel">
      <div className="panel-head">
        <h2>{t.panels.systemDecision}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <div className="decision-checks target-decision-checks">
        <h3>{t.panels.checks}</h3>
        <div className="check-list">
          {state.checks.map((check) => (
            <div className={`check-item check-${check.state} ${check.key === activeCheck ? "active" : ""}`} key={check.key}>
              <div className="check-name">
                {checkIcons[check.key]}
                <span>{t.targetChecks[check.key]}</span>
              </div>
              <StatusPill state={check.state} label={t.status[check.state]} />
            </div>
          ))}
        </div>
      </div>

      <div className="target-decision-stack">
        <section className={`target-wait-card ${waitActive ? "active" : ""} ${state.waitStatus === "timeout" ? "timeout" : ""}`}>
          <div className="target-card-head">
            <h3>
              <ClockCircleOutlined />
              {t.targetOccupied.waitTitle}
            </h3>
            <span>{t.targetWaitStatus[state.waitStatus]}</span>
          </div>
          <div className="target-wait-grid">
            <div>
              <span>{t.targetOccupied.waitObject}</span>
              <strong>L2-P03</strong>
            </div>
            <div>
              <span>{t.targetOccupied.waitDuration}</span>
              <strong>5 min</strong>
            </div>
            <div>
              <span>{t.targetOccupied.currentStatus}</span>
              <strong>{state.waitStatus === "timeout" ? t.targetOccupied.waitTimeout : state.waitStatus === "waiting" ? t.targetOccupied.waitChecking : t.targetWaitStatus.notStarted}</strong>
            </div>
            <div>
              <span>{t.targetOccupied.strategyResult}</span>
              <strong>{state.waitStatus === "timeout" ? t.targetOccupied.statusBuffering : state.waitStatus === "waiting" ? t.targetOccupied.statusWaiting : t.targetOccupied.statusHold}</strong>
            </div>
          </div>
          <div className="target-wait-progress">
            <i style={{ width: `${state.waitProgress}%` }} />
          </div>
        </section>

        <article className={`target-buffer-task-card ${bufferActive ? "active" : ""} ${state.bufferTaskStatus === "notGenerated" ? "dimmed" : ""} ${state.bufferTaskStatus === "completed" ? "completed" : ""}`}>
          <div className="target-task-head">
            <h3>
              <span>TASK-BUF-004</span>
              <strong>{t.targetOccupied.taskTypeBuffer}</strong>
            </h3>
            <StatusPill state={state.bufferTaskStatus} label={t.status[state.bufferTaskStatus]} />
          </div>
          <div className="target-task-route">
            <span>OUT-02</span>
            <b>→</b>
            <span>BUF-01</span>
          </div>
          <div className="target-task-fields">
            <div>
              <span>{t.targetOccupied.originalTarget}</span>
              <strong>L2-P03</strong>
            </div>
            <div>
              <span>{t.targetOccupied.newTarget}</span>
              <strong>BUF-01</strong>
            </div>
          </div>
          {state.bufferTaskStatus === "completed" ? (
            <div className="task-complete-mark">
              <CheckCircleFilled />
            </div>
          ) : null}
        </article>

        <section className={`target-alarm-info-card ${alarmActive ? "active" : ""}`}>
          <div className="target-card-head">
            <h3>
              <AlertOutlined />
              {t.targetOccupied.alarmInfoTitle}
            </h3>
            <span>{t.targetAlarmStatus[state.alarmStatus]}</span>
          </div>
          <div className="target-alarm-grid">
            <div>
              <span>{t.targetOccupied.alarmId}</span>
              <strong>ALM-004</strong>
            </div>
            <div>
              <span>{t.targetOccupied.relatedPoint}</span>
              <strong>L2-P03</strong>
            </div>
            <div>
              <span>{t.targetOccupied.alarmType}</span>
              <strong>{t.targetOccupied.alarmTypeValue}</strong>
            </div>
            <div>
              <span>{t.targetOccupied.actionAdvice}</span>
              <strong>{t.targetOccupied.actionAdviceValue}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
