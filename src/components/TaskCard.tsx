import { CheckCircleFilled } from "@ant-design/icons";
import type { TaskState, TranslationDict } from "../types";
import StatusPill from "./StatusPill";

interface TaskCardProps {
  title: string;
  taskId: string;
  taskType: string;
  from: string;
  to: string;
  state: TaskState;
  active: boolean;
  dimmed?: boolean;
  t: TranslationDict;
}

export default function TaskCard({ title, taskId, taskType, from, to, state, active, dimmed, t }: TaskCardProps) {
  const completed = state === "completed" || state === "executable";

  return (
    <article className={`task-card ${active ? "active" : ""} ${dimmed ? "dimmed" : ""} ${completed ? "completed" : ""}`}>
      <div className="task-card-head">
        <h3>{title}</h3>
        <StatusPill state={state} label={t.status[state]} />
      </div>

      <div className="task-fields">
        <div>
          <span>{t.tasks.taskId}</span>
          <strong>{taskId}</strong>
        </div>
        <div>
          <span>{t.tasks.taskType}</span>
          <strong>{taskType}</strong>
        </div>
        <div>
          <span>{t.tasks.from}</span>
          <strong>{from}</strong>
        </div>
        <div>
          <span>{t.tasks.to}</span>
          <strong>{to}</strong>
        </div>
      </div>

      {completed ? (
        <div className="task-complete-mark">
          <CheckCircleFilled />
        </div>
      ) : null}
    </article>
  );
}
