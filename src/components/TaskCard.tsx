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
    <article className={`task-card ${active ? "active" : ""} ${dimmed ? "dimmed" : ""} ${completed ? "completed" : ""}`} aria-label={`${title} ${taskId}`}>
      <div className="task-card-head">
        <h3>
          <span>{taskId}</span>
          <strong>{taskType}</strong>
        </h3>
        <StatusPill state={state} label={t.status[state]} />
      </div>

      <div className="task-route">
        <span>{from}</span>
        <b>→</b>
        <span>{to}</span>
      </div>

      {completed ? (
        <div className="task-complete-mark">
          <CheckCircleFilled />
        </div>
      ) : null}
    </article>
  );
}
