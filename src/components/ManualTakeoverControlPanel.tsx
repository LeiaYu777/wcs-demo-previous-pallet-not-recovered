import { AlertOutlined, AuditOutlined, CheckCircleFilled, CloseCircleOutlined, EditOutlined, InboxOutlined, NodeIndexOutlined, SendOutlined, StopOutlined, ToolOutlined } from "@ant-design/icons";
import type { DemoStep, ManualActionId, ManualAuditLog, ManualTakeoverDerivedState, ManualTaskStatus } from "../types";
import type { ManualTakeoverTranslationDict } from "../manualTakeoverI18n";

interface ManualTakeoverControlPanelProps {
  currentStep: DemoStep;
  state: ManualTakeoverDerivedState;
  t: ManualTakeoverTranslationDict;
}

const actionIcons: Record<ManualActionId, React.ReactNode> = {
  manualReleasePoint: <NodeIndexOutlined />,
  manualChangeDestination: <EditOutlined />,
  manualTransferBuffer: <InboxOutlined />,
  manualCancelTask: <StopOutlined />,
  manualResendRcs: <SendOutlined />,
  manualConfirmException: <CheckCircleFilled />,
};

const actionOrder: ManualActionId[] = [
  "manualReleasePoint",
  "manualChangeDestination",
  "manualTransferBuffer",
  "manualCancelTask",
  "manualResendRcs",
  "manualConfirmException",
];

function statusLabel(status: ManualTaskStatus, t: ManualTakeoverTranslationDict) {
  return t.manual.statusLabels[status];
}

function AuditItem({ log, t, latest }: { log: ManualAuditLog; t: ManualTakeoverTranslationDict; latest: boolean }) {
  return (
    <article className={`manual-audit-row ${latest ? "latest" : ""}`}>
      <div className="manual-audit-row-head">
        <strong>{log.time}</strong>
        <span>{log.operator}</span>
        <em>{t.manual.actions[log.actionId]}</em>
      </div>
      <div className="manual-audit-row-body">
        <div>
          <span>{t.manual.object}</span>
          <strong>{log.target}</strong>
        </div>
        <div>
          <span>{t.manual.before}</span>
          <strong>{log.before}</strong>
        </div>
        <div>
          <span>{t.manual.after}</span>
          <strong>{log.after}</strong>
        </div>
        <div>
          <span>{t.manual.reason}</span>
          <strong>{log.reason}</strong>
        </div>
      </div>
    </article>
  );
}

export default function ManualTakeoverControlPanel({ currentStep, state, t }: ManualTakeoverControlPanelProps) {
  const latestLog = state.auditLogs[state.auditLogs.length - 1];
  const visibleLogs = state.auditLogs.slice(-4);

  return (
    <section className="panel system-panel manual-system-panel">
      <div className="panel-head">
        <h2>{t.panels.systemDecision}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <section className={`manual-overview-card status-${state.exceptionStatus}`}>
        <div className="manual-card-head">
          <h3>
            <AlertOutlined />
            {t.manual.overviewTitle}
          </h3>
          <span>{t.manual.statusLabels[state.exceptionStatus]}</span>
        </div>
        <div className="manual-overview-grid">
          <div>
            <span>{t.manual.exceptionId}</span>
            <strong>EX-06</strong>
          </div>
          <div>
            <span>{t.manual.relatedTask}</span>
            <strong>TASK-NXT-006</strong>
          </div>
          <div>
            <span>{t.manual.originalTarget}</span>
            <strong>L2-P03</strong>
          </div>
          <div>
            <span>{t.manual.processMode}</span>
            <strong>{t.manual.manualMode}</strong>
          </div>
        </div>
      </section>

      <section className="manual-operation-card">
        <div className="manual-section-head">
          <ToolOutlined />
          <strong>{t.manual.operationTitle}</strong>
        </div>
        <div className="manual-action-grid">
          {actionOrder.map((actionId) => (
            <div className={`manual-action-button state-${state.actionStates[actionId]}`} key={actionId}>
              {actionIcons[actionId]}
              <span>{t.manual.actions[actionId]}</span>
              <em>{state.actionStates[actionId] === "done" || state.actionStates[actionId] === "active" ? t.manual.statusLabels[actionId] : t.status.waiting}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="manual-task-status-card">
        <div className="manual-section-head">
          <AuditOutlined />
          <strong>{t.manual.taskTitle}</strong>
        </div>
        <div className="manual-task-grid">
          <article className={`manual-task-mini status-${state.originalTaskStatus}`}>
            <h3>
              <span>TASK-NXT-006</span>
              <strong>{t.manual.taskTypes.original}</strong>
            </h3>
            <p>OUT-03 → L2-P03</p>
            <em>{statusLabel(state.originalTaskStatus, t)}</em>
          </article>
          <article className={`manual-task-mini status-${state.bufferTaskStatus}`}>
            <h3>
              <span>TASK-BUF-006</span>
              <strong>{t.manual.taskTypes.buffer}</strong>
            </h3>
            <p>OUT-03 → BUF-01</p>
            <em>{statusLabel(state.bufferTaskStatus, t)}</em>
          </article>
          <article className={`manual-task-mini status-${state.rcsTaskStatus}`}>
            <h3>
              <span>TASK-RCS-006</span>
              <strong>{t.manual.taskTypes.rcs}</strong>
            </h3>
            <p>BUF-01 → L2-P07</p>
            <em>{statusLabel(state.rcsTaskStatus, t)}</em>
          </article>
        </div>
      </section>

      <section className="manual-audit-card">
        <div className="manual-card-head">
          <h3>
            <AuditOutlined />
            {t.manual.auditTitle}
          </h3>
          <span>{state.auditLogs.length ? `${state.auditLogs.length} / 6` : t.manual.statusLabels.recorded}</span>
        </div>
        <div className="manual-audit-list">
          {visibleLogs.length ? (
            visibleLogs.map((log) => <AuditItem key={log.actionId} latest={log.actionId === latestLog?.actionId} log={log} t={t} />)
          ) : (
            <div className="manual-audit-empty">
              <CloseCircleOutlined />
              <span>{t.manual.positioning}</span>
            </div>
          )}
        </div>
        <div className="manual-audit-total">{t.manual.auditCount}</div>
      </section>
    </section>
  );
}
