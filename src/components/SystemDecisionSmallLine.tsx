import { AimOutlined, ClockCircleOutlined, FileDoneOutlined, SendOutlined } from "@ant-design/icons";
import type { SmallLineCheckKey, SmallLineDerivedState, TranslationDict } from "../types";
import StatusPill from "./StatusPill";

interface SystemDecisionSmallLineProps {
  state: SmallLineDerivedState;
  t: TranslationDict;
}

const checkIcons: Record<SmallLineCheckKey, React.ReactNode> = {
  planImport: <FileDoneOutlined />,
  timeCall: <ClockCircleOutlined />,
  linePoint: <AimOutlined />,
  deliveryPermission: <SendOutlined />,
};

interface SmallTaskCardProps {
  title: string;
  state: SmallLineDerivedState["deliveryTaskStatus"];
  active: boolean;
  dimmed: boolean;
  fields: Array<{ label: string; value: string }>;
  t: TranslationDict;
}

function SmallTaskCard({ title, state, active, dimmed, fields, t }: SmallTaskCardProps) {
  const completed = state === "completed";

  return (
    <article className={`task-card small-task-card ${active ? "active" : ""} ${dimmed ? "dimmed" : ""} ${completed ? "completed" : ""}`}>
      <div className="task-card-head">
        <h3>{title}</h3>
        <StatusPill state={state} label={t.status[state]} />
      </div>
      <div className="task-fields small-task-fields">
        {fields.map((field) => (
          <div key={field.label}>
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function SystemDecisionSmallLine({ state, t }: SystemDecisionSmallLineProps) {
  return (
    <section className="panel system-panel small-line-system">
      <div className="panel-head">
        <h2>{t.panels.systemDecision}</h2>
        <span>{state.isClosed ? t.scene.flowClosed : t.scene.noUpperSystem}</span>
      </div>

      <div className="decision-checks">
        <h3>{t.panels.checks}</h3>
        <div className="check-list">
          {state.checks.map((check) => (
            <div className={`check-item check-${check.state}`} key={check.key}>
              <div className="check-name">
                {checkIcons[check.key]}
                <span>{t.smallChecks[check.key]}</span>
              </div>
              <StatusPill state={check.state} label={t.status[check.state]} />
            </div>
          ))}
        </div>
      </div>

      <div className="task-list">
        <SmallTaskCard
          title={t.tasks.deliveryTitle}
          state={state.deliveryTaskStatus}
          active={state.deliveryTaskStatus === "pending" || state.deliveryTaskStatus === "running"}
          dimmed={state.deliveryTaskStatus === "notGenerated"}
          t={t}
          fields={[
            { label: t.tasks.taskId, value: "TASK-DEL-001" },
            { label: t.tasks.taskType, value: t.tasks.deliveryType },
            { label: t.tasks.material, value: t.plan.materialValue },
            { label: t.tasks.qty, value: t.plan.qtyValue },
            { label: t.tasks.from, value: "MAT-AREA-01" },
            { label: t.tasks.to, value: "L1-P01" },
          ]}
        />
        <SmallTaskCard
          title={t.tasks.recoveryTitle}
          state={state.returnTaskStatus}
          active={state.returnTaskStatus === "running"}
          dimmed={state.returnTaskStatus === "notGenerated"}
          t={t}
          fields={[
            { label: t.tasks.taskId, value: "TASK-RET-001" },
            { label: t.tasks.taskType, value: t.tasks.recoveryType },
            { label: t.tasks.from, value: "L1-P01" },
            { label: t.tasks.to, value: "RET-AREA-01" },
          ]}
        />
      </div>
    </section>
  );
}
