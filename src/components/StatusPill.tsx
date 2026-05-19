import { CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled, PauseCircleFilled, WarningFilled } from "@ant-design/icons";
import type { CheckState, TaskState } from "../types";

interface StatusPillProps {
  state: CheckState | TaskState;
  label: string;
}

function iconForState(state: CheckState | TaskState) {
  if (state === "ok" || state === "completed" || state === "executable") return <CheckCircleFilled />;
  if (state === "ng") return <CloseCircleFilled />;
  if (state === "running" || state === "pending" || state === "waitingPoint") return <ClockCircleOutlined />;
  if (state === "hold") return <PauseCircleFilled />;
  return <WarningFilled />;
}

export function statusTone(state: CheckState | TaskState) {
  if (state === "ok" || state === "completed" || state === "executable") return "ok";
  if (state === "ng") return "ng";
  if (state === "running" || state === "pending" || state === "waitingPoint") return "processing";
  return "hold";
}

export default function StatusPill({ state, label }: StatusPillProps) {
  return (
    <span className={`status-pill status-${statusTone(state)}`}>
      {iconForState(state)}
      <span>{label}</span>
    </span>
  );
}
