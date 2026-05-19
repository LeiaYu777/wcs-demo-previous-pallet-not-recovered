import { InboxOutlined, SafetyCertificateOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";
import type { CheckKey, DemoDerivedState, DemoStep, TranslationDict } from "../types";
import StatusPill from "./StatusPill";
import TaskCard from "./TaskCard";

interface SystemDecisionPanelProps {
  currentStep: DemoStep;
  state: DemoDerivedState;
  t: TranslationDict;
}

const checkIcons: Record<CheckKey, React.ReactNode> = {
  takt: <SyncOutlined />,
  previousRecovery: <InboxOutlined />,
  pointIdle: <SafetyCertificateOutlined />,
  nextPermission: <SendOutlined />,
};

function getActiveCheckKey(currentStep: DemoStep): CheckKey {
  if (currentStep <= 1) return "takt";
  if (currentStep <= 2) return "previousRecovery";
  if (currentStep === 5) return "pointIdle";
  if (currentStep === 6) return "nextPermission";
  return "nextPermission";
}

export default function SystemDecisionPanel({ currentStep, state, t }: SystemDecisionPanelProps) {
  const recoveryActive = currentStep === 4 || currentStep === 5;
  const nextActive = currentStep === 3 || currentStep === 6;
  const activeCheckKey = getActiveCheckKey(currentStep);

  return (
    <section className="panel system-panel">
      <div className="panel-head">
        <h2>{t.panels.systemDecision}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <div className="decision-checks">
        <h3>{t.panels.checks}</h3>
        <div className="check-list">
          {state.checks.map((check) => (
            <div className={`check-item check-${check.state} ${check.key === activeCheckKey ? "active" : ""}`} key={check.key}>
              <div className="check-name">
                {checkIcons[check.key]}
                <span>{t.checks[check.key]}</span>
              </div>
              <StatusPill state={check.state} label={t.status[check.state]} />
            </div>
          ))}
        </div>
      </div>

      <div className="task-list">
        <TaskCard
          title={t.tasks.recoveryTitle}
          taskId="TASK-RET-001"
          taskType={t.tasks.recoveryType}
          from="L2-P03"
          to="RET-AREA-01"
          state={state.recoveryTaskStatus}
          active={recoveryActive}
          dimmed={state.recoveryTaskStatus === "notGenerated"}
          t={t}
        />
        <TaskCard
          title={t.tasks.nextTitle}
          taskId="TASK-NXT-002"
          taskType={t.tasks.nextType}
          from="ASRS-OUT-02"
          to="L2-P07"
          state={state.nextTaskStatus}
          active={nextActive}
          dimmed={state.nextTaskStatus !== "executable" && currentStep < 3}
          t={t}
        />
      </div>
    </section>
  );
}
