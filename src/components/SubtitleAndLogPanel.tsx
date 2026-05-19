import type { DemoStep, Language, LogKey, TranslationDict } from "../types";

interface SubtitleAndLogPanelProps {
  currentStep: DemoStep;
  captionMode?: "compact" | "panel";
  language?: Language;
  logMode?: "compact" | "hidden" | "panel";
  logs: LogKey[];
  subtitleEnabled: boolean;
  t: TranslationDict;
}

export default function SubtitleAndLogPanel({ currentStep, captionMode = "panel", language = "zh", logMode = "panel", logs, subtitleEnabled, t }: SubtitleAndLogPanelProps) {
  const latestLog = logs[logs.length - 1];
  const compactLogs = logs.slice(-2);

  if (captionMode === "compact" || logMode !== "panel") {
    return (
      <footer className={`bottom-panel overlay-mode caption-${captionMode} log-${logMode} ${subtitleEnabled ? "" : "subtitle-hidden"}`}>
        {subtitleEnabled && captionMode === "compact" ? <section className={`compact-caption lang-${language}`}>{t.subtitles[currentStep]}</section> : null}
        {logMode === "compact" ? (
          <section className={`compact-log ${subtitleEnabled ? "caption-visible" : ""}`}>
            <div className="compact-log-title">{t.panels.logs}</div>
            <ul>
              {compactLogs.map((logKey) => (
                <li className={logKey === latestLog ? "latest" : ""} key={logKey}>
                  <span />
                  {t.logs[logKey]}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </footer>
    );
  }

  return (
    <footer className={`bottom-panel mode-panel ${subtitleEnabled ? "" : "subtitle-hidden"}`}>
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
