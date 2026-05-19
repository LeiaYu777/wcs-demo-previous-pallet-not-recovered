import { AimOutlined, CheckCircleFilled, FieldTimeOutlined, FileDoneOutlined, NodeIndexOutlined, TableOutlined } from "@ant-design/icons";
import type { DemoStep, Language, PlanImportCheckKey, PlanImportDerivedState, PlanImportRow, PlanImportTask } from "../types";
import type { PlanImportTranslationDict } from "../planImportI18n";
import StatusPill from "./StatusPill";

interface GeneratedTaskPanelProps {
  currentStep: DemoStep;
  language: Language;
  plans: PlanImportRow[];
  tasks: PlanImportTask[];
  state: PlanImportDerivedState;
  t: PlanImportTranslationDict;
}

const checkIcons: Record<PlanImportCheckKey, React.ReactNode> = {
  planImport: <TableOutlined />,
  fieldParse: <FileDoneOutlined />,
  targetIdentify: <AimOutlined />,
  taskGenerate: <NodeIndexOutlined />,
};

function activeCheckForStep(currentStep: DemoStep): PlanImportCheckKey {
  if (currentStep === 1) return "planImport";
  if (currentStep === 2) return "fieldParse";
  if (currentStep === 3) return "targetIdentify";
  return "taskGenerate";
}

function planForTask(task: PlanImportTask, plans: PlanImportRow[]) {
  return plans.find((plan) => plan.id === task.planId) ?? plans[0];
}

export default function GeneratedTaskPanel({ currentStep, language, plans, tasks, state, t }: GeneratedTaskPanelProps) {
  const activeCheck = activeCheckForStep(currentStep);

  return (
    <section className="panel system-panel plan-task-panel">
      <div className="panel-head">
        <h2>{t.panels.systemDecision}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <div className="decision-checks plan-decision-checks">
        <h3>{t.planImport.parseTitle}</h3>
        <div className="check-list">
          {state.checks.map((check) => (
            <div className={`check-item check-${check.state} ${check.key === activeCheck ? "active" : ""}`} key={check.key}>
              <div className="check-name">
                {checkIcons[check.key]}
                <span>{t.planChecks[check.key]}</span>
              </div>
              <StatusPill state={check.state} label={t.status[check.state]} />
            </div>
          ))}
        </div>
      </div>

      <div className="plan-task-stack">
        <section className="plan-generated-list">
          <div className="plan-section-head">
            <FileDoneOutlined />
            <strong>{t.planImport.taskTitle}</strong>
          </div>
          <div className="plan-task-card-list">
            {tasks.map((task) => {
              const plan = planForTask(task, plans);
              const status = state.taskStatuses[task.id];
              return (
                <article className={`plan-task-card status-${status} ${state.activeTaskId === task.id ? "active" : ""}`} key={task.id}>
                  <div className="plan-task-card-head">
                    <h3>
                      <span>{task.id}</span>
                      <strong>{language === "zh" ? task.typeZh : task.typeJa}</strong>
                    </h3>
                    <em>{t.planTaskStatus[status]}</em>
                  </div>
                  <div className="plan-task-card-grid">
                    <div>
                      <span>{t.planImport.taskTime}</span>
                      <strong>{plan.time}</strong>
                    </div>
                    <div>
                      <span>{t.planImport.taskLine}</span>
                      <strong>{plan.line}</strong>
                    </div>
                    <div>
                      <span>{t.planImport.taskMaterial}</span>
                      <strong>{language === "zh" ? plan.materialZh : plan.materialJa}</strong>
                    </div>
                    <div>
                      <span>{t.planImport.taskQty}</span>
                      <strong>{language === "zh" ? plan.qtyZh : plan.qtyJa}</strong>
                    </div>
                    <div>
                      <span>{t.planImport.taskTarget}</span>
                      <strong>{plan.target}</strong>
                    </div>
                  </div>
                  {status === "pending" ? <CheckCircleFilled className="plan-task-done-icon" /> : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className={`plan-next-card ${state.nextStepActive ? "active" : ""}`}>
          <div>
            <FieldTimeOutlined />
            <strong>{t.planImport.nextTitle}</strong>
          </div>
          <p>{t.planImport.nextDesc}</p>
        </section>
      </div>
    </section>
  );
}
