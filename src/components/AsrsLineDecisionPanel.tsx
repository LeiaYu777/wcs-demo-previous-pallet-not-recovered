import { AlertOutlined, BarcodeOutlined, CheckCircleFilled, CloudServerOutlined, NodeIndexOutlined, SendOutlined } from "@ant-design/icons";
import type { AsrsLineCheckKey, AsrsLineDerivedState, DemoStep } from "../types";
import type { AsrsLineTranslationDict } from "../asrsLineI18n";
import StatusPill from "./StatusPill";

interface AsrsLineDecisionPanelProps {
  currentStep: DemoStep;
  state: AsrsLineDerivedState;
  t: AsrsLineTranslationDict;
}

const checkIcons: Record<AsrsLineCheckKey, React.ReactNode> = {
  outArrival: <CloudServerOutlined />,
  inspectConfirm: <BarcodeOutlined />,
  targetReceivable: <NodeIndexOutlined />,
  agvPermission: <SendOutlined />,
};

function getActiveCheckKey(currentStep: DemoStep): AsrsLineCheckKey {
  if (currentStep <= 1) return "outArrival";
  if (currentStep === 2) return "inspectConfirm";
  if (currentStep === 3) return "targetReceivable";
  return "agvPermission";
}

export default function AsrsLineDecisionPanel({ currentStep, state, t }: AsrsLineDecisionPanelProps) {
  const activeCheckKey = getActiveCheckKey(currentStep);
  const taskActive = currentStep >= 3 && currentStep <= 5;
  const strategyActive = currentStep >= 6;

  return (
    <section className="panel system-panel asrs-system-panel">
      <div className="panel-head">
        <h2>{t.panels.systemDecision}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <div className="decision-checks asrs-decision-checks">
        <h3>{t.panels.checks}</h3>
        <div className="check-list">
          {state.checks.map((check) => (
            <div className={`check-item check-${check.state} ${check.key === activeCheckKey ? "active" : ""}`} key={check.key}>
              <div className="check-name">
                {checkIcons[check.key]}
                <span>{t.asrsChecks[check.key]}</span>
              </div>
              <StatusPill state={check.state} label={t.status[check.state]} />
            </div>
          ))}
        </div>
      </div>

      <div className="asrs-task-stack">
        <article className={`asrs-task-card ${taskActive ? "active" : ""} ${state.deliveryTaskStatus === "notGenerated" ? "dimmed" : ""} ${state.deliveryTaskStatus === "completed" ? "completed" : ""}`}>
          <div className="asrs-task-head">
            <h3>
              <span>TASK-DEL-101</span>
              <strong>{t.asrs.taskType}</strong>
            </h3>
            <StatusPill state={state.deliveryTaskStatus} label={t.status[state.deliveryTaskStatus]} />
          </div>
          <div className="asrs-task-route">
            <span>ASRS-OUT-01</span>
            <b>→</b>
            <span>INSPECT-01</span>
            <b>→</b>
            <span>L1-P03</span>
          </div>
          {state.deliveryTaskStatus === "completed" ? (
            <div className="task-complete-mark">
              <CheckCircleFilled />
            </div>
          ) : null}
        </article>

        <section className={`asrs-strategy-panel ${strategyActive ? "active" : ""}`}>
          <div className="asrs-strategy-head">
            <AlertOutlined />
            <strong>{t.asrs.strategyTitle}</strong>
          </div>
          <div className="asrs-strategy-list">
            <div>
              <span>{t.asrs.strategyWaitTitle}</span>
              <p>{t.asrs.strategyWaitDesc}</p>
            </div>
            <div>
              <span>{t.asrs.strategyBufferTitle}</span>
              <p>{t.asrs.strategyBufferDesc}</p>
            </div>
            <div>
              <span>{t.asrs.strategyAlertTitle}</span>
              <p>{t.asrs.strategyAlertDesc}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
