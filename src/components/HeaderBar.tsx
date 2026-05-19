import {
  HomeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SoundOutlined,
  StepForwardOutlined,
  SubnodeOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Segmented, Switch } from "antd";
import type { DemoStep, Language, TranslationDict } from "../types";

interface HeaderBarProps {
  language: Language;
  currentStep: DemoStep;
  stepCount: number;
  onHome?: () => void;
  isPlaying: boolean;
  isLoop: boolean;
  voiceEnabled: boolean;
  subtitleEnabled: boolean;
  hideControls?: boolean;
  t: TranslationDict;
  onLanguageChange: (language: Language) => void;
  onToggleAuto: () => void;
  onNext: () => void;
  onReset: () => void;
  onLoopChange: (enabled: boolean) => void;
  onVoiceChange: (enabled: boolean) => void;
  onSubtitleChange: (enabled: boolean) => void;
}

export default function HeaderBar({
  language,
  currentStep,
  stepCount,
  onHome,
  isPlaying,
  isLoop,
  voiceEnabled,
  subtitleEnabled,
  hideControls = false,
  t,
  onLanguageChange,
  onToggleAuto,
  onNext,
  onReset,
  onLoopChange,
  onVoiceChange,
  onSubtitleChange,
}: HeaderBarProps) {
  return (
    <header className={`header-bar ${hideControls ? "controls-hidden" : ""}`}>
      <div className="brand-area">
        <div className="brand-icon">
          <ThunderboltOutlined />
        </div>
        <div className="brand-copy">
          <strong>{t.app.brand}</strong>
          <span>{t.app.demoBadge}</span>
        </div>
      </div>

      <div className="title-area">
        <h1>{t.app.title}</h1>
        <p>{t.app.subtitle}</p>
      </div>

      {hideControls ? null : (
        <div className="control-area">
          <div className="control-top">
            {onHome ? (
              <Button size="small" icon={<HomeOutlined />} onClick={onHome}>
                {t.controls.home}
              </Button>
            ) : null}
            <Segmented
              size="small"
              value={language}
              options={[
                { label: t.controls.languageZh, value: "zh" },
                { label: t.controls.languageJa, value: "ja" },
              ]}
              onChange={(value) => onLanguageChange(value as Language)}
            />
            <div className="step-chip">
              {t.app.stepLabel} {currentStep} / {stepCount}
            </div>
          </div>

          <div className="control-actions">
            <Button size="small" type="primary" icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={onToggleAuto}>
              {isPlaying ? t.controls.pause : t.controls.start}
            </Button>
            <Button size="small" icon={<StepForwardOutlined />} onClick={onNext} disabled={isPlaying || currentStep === stepCount}>
              {t.controls.next}
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={onReset}>
              {t.controls.reset}
            </Button>
            <label className="compact-switch">
              <span>{t.controls.loop}</span>
              <Switch
                aria-label={t.controls.loop}
                size="small"
                checked={isLoop}
                checkedChildren={<SyncOutlined />}
                unCheckedChildren={<SyncOutlined />}
                onChange={onLoopChange}
              />
            </label>
            <label className="compact-switch">
              <span>{t.controls.voice}</span>
              <Switch
                aria-label={t.controls.voice}
                size="small"
                checked={voiceEnabled}
                checkedChildren={<SoundOutlined />}
                unCheckedChildren={<SoundOutlined />}
                onChange={onVoiceChange}
              />
            </label>
            <label className="compact-switch">
              <span>{t.controls.subtitle}</span>
              <Switch
                aria-label={t.controls.subtitle}
                size="small"
                checked={subtitleEnabled}
                checkedChildren={<SubnodeOutlined />}
                unCheckedChildren={<SubnodeOutlined />}
                onChange={onSubtitleChange}
              />
            </label>
          </div>
        </div>
      )}
    </header>
  );
}
