import { ApartmentOutlined, CheckCircleOutlined, ControlOutlined } from "@ant-design/icons";
import type { StageId, TranslationDict } from "../types";

interface StageTimelineProps {
  activeStage: StageId;
  t: TranslationDict;
}

const stageIcons = {
  1: <ApartmentOutlined />,
  2: <ControlOutlined />,
  3: <CheckCircleOutlined />,
};

export default function StageTimeline({ activeStage, t }: StageTimelineProps) {
  return (
    <section className="stage-timeline" aria-label="Stage timeline">
      {([1, 2, 3] as StageId[]).map((stageId) => (
        <div className={`stage-card ${activeStage === stageId ? "active" : ""}`} key={stageId}>
          <div className="stage-index">{stageIcons[stageId]}</div>
          <div>
            <h2>{t.stages[stageId].title}</h2>
            <p>{t.stages[stageId].description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
