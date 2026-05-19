import { CheckCircleFilled, FileExcelOutlined, SettingOutlined } from "@ant-design/icons";
import type { DemoStep, Language, PlanImportDerivedState, PlanImportRow } from "../types";
import type { PlanImportTranslationDict } from "../planImportI18n";

interface PlanExcelTableProps {
  currentStep: DemoStep;
  language: Language;
  plans: PlanImportRow[];
  state: PlanImportDerivedState;
  t: PlanImportTranslationDict;
}

const configKeys = [
  "packageKitCheck",
  "asrsWcsIntegration",
  "physicalDetection",
  "cameraQrCheck",
  "linePointCheck",
  "previousPalletReturnCheck",
  "autoDispatchRcs",
  "waitBufferAlarmStrategy",
];

function configTone(index: number) {
  if (index <= 1) return "on";
  if (index <= 5) return "standard";
  if (index === 6) return "optional";
  return "advanced";
}

function configLabel(index: number, t: PlanImportTranslationDict) {
  const tone = configTone(index);
  return t.planImport.configStatus[tone];
}

export default function PlanExcelTable({ currentStep, language, plans, state, t }: PlanExcelTableProps) {
  return (
    <section className="panel physical-panel plan-import-panel">
      <div className="panel-head">
        <h2>{t.panels.physicalScene}</h2>
        <span>{t.stepNotes[currentStep]}</span>
      </div>

      <div className="plan-import-canvas">
        <section className="plan-excel-card">
          <div className="plan-excel-head">
            <div>
              <FileExcelOutlined />
              <strong>{t.planImport.excelTitle}</strong>
            </div>
            <span>{t.planImport.generatedCount}: {state.generatedCount} / 3</span>
          </div>

          <div className={`plan-excel-table ${state.fieldHighlight ? "field-highlight" : ""} ${state.targetHighlight ? "target-highlight" : ""}`}>
            <div className="plan-excel-row plan-excel-header">
              <span>{t.planImport.columns.time}</span>
              <span>{t.planImport.columns.line}</span>
              <span>{t.planImport.columns.product}</span>
              <span>{t.planImport.columns.material}</span>
              <span>{t.planImport.columns.qty}</span>
              <span>{t.planImport.columns.target}</span>
              <span>{t.planImport.columns.parseStatus}</span>
            </div>
            {plans.map((plan) => {
              const status = state.rowStatuses[plan.id];
              return (
                <div className={`plan-excel-row status-${status} ${state.activeRowId === plan.id ? "active" : ""}`} key={plan.id}>
                  <span>{plan.time}</span>
                  <span>{plan.line}</span>
                  <span>{plan.product}</span>
                  <span>{language === "zh" ? plan.materialZh : plan.materialJa}</span>
                  <span>{language === "zh" ? plan.qtyZh : plan.qtyJa}</span>
                  <span>{plan.target}</span>
                  <span className="plan-row-status">
                    {status === "generated" ? <CheckCircleFilled /> : null}
                    {t.planRowStatus[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`plan-config-card ${state.configActive ? "active" : ""}`}>
          <div className="plan-config-head">
            <SettingOutlined />
            <strong>{t.planImport.configTitle}</strong>
            <span>{t.planImport.positioning}</span>
          </div>
          <div className="plan-config-grid">
            {configKeys.map((key, index) => (
              <div className={`plan-config-chip tone-${configTone(index)}`} key={key}>
                <span>{t.planImport.configItems[key]}</span>
                <em>{configLabel(index, t)}</em>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
