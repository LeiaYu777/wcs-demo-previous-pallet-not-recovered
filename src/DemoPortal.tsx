import { AppstoreOutlined, ArrowRightOutlined, DeploymentUnitOutlined, InboxOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Segmented } from "antd";
import { useState } from "react";
import { portalDemoRegistry } from "./showcase/demoRegistry";
import type { DemoRegistryItem } from "./showcase/types";
import type { Language } from "./types";

interface DemoPortalProps {
  onOpenDemo: (path: string) => void;
}

const portalCopy = {
  zh: {
    brand: "WCS Demo Center",
    subtitle: "生产线边物流 WCS 调度系统",
    title: "线边物流演示入口",
    description: "选择一个独立场景页进行展会演示。后续 Demo 只需要在入口注册即可统一切换。",
    open: "进入演示",
    coming: "预留场景位",
  },
  ja: {
    brand: "WCS Demo Center",
    subtitle: "生産ラインサイド物流 WCS 調度システム",
    title: "ラインサイド物流デモ入口",
    description: "展示用の独立シーンを選択します。今後の Demo も入口へ登録するだけで切替できます。",
    open: "デモ開始",
    coming: "予約枠",
  },
};

function DemoIcon({ demo }: { demo: DemoRegistryItem }) {
  if (demo.id === "small-line-logistics") return <DeploymentUnitOutlined />;
  if (demo.id === "demo5-previous-pallet") return <InboxOutlined />;
  return <AppstoreOutlined />;
}

export default function DemoPortal({ onOpenDemo }: DemoPortalProps) {
  const [language, setLanguage] = useState<Language>("zh");
  const t = portalCopy[language];

  return (
    <div className="portal-shell">
      <header className="portal-header">
        <div className="brand-area">
          <div className="brand-icon">
            <ThunderboltOutlined />
          </div>
          <div className="brand-copy">
            <strong>{t.brand}</strong>
            <span>{t.subtitle}</span>
          </div>
        </div>
        <Segmented
          size="small"
          value={language}
          options={[
            { label: "中文", value: "zh" },
            { label: "日本語", value: "ja" },
          ]}
          onChange={(value) => setLanguage(value as Language)}
        />
      </header>

      <main className="portal-main">
        <section className="portal-hero">
          <div className="portal-kicker">
            <AppstoreOutlined />
            WCS Demo
          </div>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </section>

        <section className="demo-card-grid">
          {portalDemoRegistry.map((demo) => (
            <article className={`demo-card ${demo.featured ? "featured" : ""} ${demo.enabled ? "" : "placeholder-card"}`} key={demo.id}>
              <div className="demo-card-icon">
                <DemoIcon demo={demo} />
              </div>
              <div className="demo-card-body">
                <span>{demo.enabled ? demo.portalTag[language] : t.coming}</span>
                <h2>{demo.title[language]}</h2>
                <p>{demo.subtitle[language]}</p>
              </div>
              <Button disabled={!demo.enabled} icon={<ArrowRightOutlined />} type={demo.featured ? "primary" : "default"} onClick={() => onOpenDemo(demo.path)}>
                {demo.enabled ? t.open : t.coming}
              </Button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
