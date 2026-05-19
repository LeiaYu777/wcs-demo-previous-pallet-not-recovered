import type { DemoStep, LogKey, TranslationDict } from "../types";

interface SubtitleAndLogPanelProps {
  currentStep: DemoStep;
  logs: LogKey[];
  subtitleEnabled: boolean;
  t: TranslationDict;
}

export default function SubtitleAndLogPanel({ currentStep, logs, subtitleEnabled, t }: SubtitleAndLogPanelProps) {
  const latestLog = logs[logs.length - 1];

  return (
    <footer className={`bottom-panel ${subtitleEnabled ? "" : "subtitle-hidden"}`}>
      {subtitleEnabled ? (
        <section className="subtitle-box">
          <div className="bottom-label">{t.panels.subtitle}</div>
          <p>{t.subtitles[currentStep]}</p>
        </section>
      ) : null}
      <section className="log-box">
        <div className="bottom-label">{t.panels.logs}</div>
        <ul>
          {logs.map((logKey) => (
            <li className={logKey === latestLog ? "latest" : ""} key={logKey}>
              <span />
              {t.logs[logKey]}
            </li>
          ))}
        </ul>
      </section>
    </footer>
  );
}
