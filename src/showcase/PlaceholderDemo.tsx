import { AppstoreOutlined, ClockCircleOutlined, DeploymentUnitOutlined } from "@ant-design/icons";
import "./PlaceholderDemo.css";

type PlaceholderLanguage = "zh" | "ja";

interface PlaceholderDemoProps {
  onHome?: () => void;
}

const copy = {
  zh: {
    badge: "WCS Demo",
    system: "生产线边物流 WCS 展会演示",
    title: "该 Demo 正在准备中",
    subtitle: "后续补充业务场景和系统演示",
    status: "准备中",
    stage: "场景占位",
    note: "该页面用于 Showcase 自动轮播，避免未启用 Demo 出现空白。",
  },
  ja: {
    badge: "WCS Demo",
    system: "ラインサイド物流 WCS 展示デモ",
    title: "このデモは準備中です",
    subtitle: "後日、業務シナリオとシステムデモを追加します",
    status: "準備中",
    stage: "シーン予約",
    note: "Showcase 自動再生中に、未準備のデモが空白にならないためのページです。",
  },
};

function getLanguageFromUrl(): PlaceholderLanguage {
  const lang = new URLSearchParams(window.location.search).get("lang");
  return lang === "ja" ? "ja" : "zh";
}

export default function PlaceholderDemo(_props: PlaceholderDemoProps) {
  const language = getLanguageFromUrl();
  const t = copy[language];

  return (
    <main className="placeholder-demo-shell" aria-label={t.title}>
      <section className="placeholder-card">
        <div className="placeholder-brand">
          <div className="placeholder-brand-icon">
            <DeploymentUnitOutlined />
          </div>
          <div>
            <strong>{t.badge}</strong>
            <span>{t.system}</span>
          </div>
        </div>

        <div className="placeholder-content">
          <div className="placeholder-stage">
            <AppstoreOutlined />
            <span>{t.stage}</span>
          </div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="placeholder-footer">
          <span className="placeholder-status">
            <ClockCircleOutlined />
            {t.status}
          </span>
          <span>{t.note}</span>
        </div>
      </section>
    </main>
  );
}
