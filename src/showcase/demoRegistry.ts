import PreviousPalletDemo from "../PreviousPalletDemo";
import SmallLineDemo from "../SmallLineDemo";
import AsrsLineDeliveryDemo from "../AsrsLineDeliveryDemo";
import PlaceholderDemo from "./PlaceholderDemo";
import type { DemoRegistryItem } from "./types";

export const demoRegistry: DemoRegistryItem[] = [
  {
    id: "demo1-plan-import",
    title: {
      zh: "生产计划导入",
      ja: "生産計画取込",
    },
    subtitle: {
      zh: "导入计划并自动生成待执行任务",
      ja: "計画を取り込み、実行待ちタスクを生成",
    },
    portalTag: {
      zh: "计划导入",
      ja: "計画取込",
    },
    path: "/demo1",
    durationMs: 12000,
    enabled: true,
    showInPortal: true,
    showInShowcase: true,
    component: PlaceholderDemo,
  },
  {
    id: "small-line-logistics",
    title: {
      zh: "小型线边物流",
      ja: "小規模ラインサイド物流",
    },
    subtitle: {
      zh: "不接复杂上位系统，也能按计划自动叫料",
      ja: "複雑な上位システムなしで計画駆動の呼出を実現",
    },
    portalTag: {
      zh: "计划驱动",
      ja: "計画駆動",
    },
    path: "/small-line-demo",
    durationMs: 18000,
    enabled: true,
    showInPortal: true,
    showInShowcase: true,
    featured: true,
    legacyHashes: ["small-line"],
    component: SmallLineDemo,
  },
  {
    id: "demo5-previous-pallet",
    title: {
      zh: "上一托未回收",
      ja: "前回パレット未回収",
    },
    subtitle: {
      zh: "先回收空托，再允许下一搬送",
      ja: "空パレット回収後に次搬送を許可",
    },
    portalTag: {
      zh: "点位校验",
      ja: "点位判定",
    },
    path: "/demo5",
    durationMs: 15000,
    enabled: true,
    showInPortal: true,
    showInShowcase: true,
    legacyHashes: ["demo5"],
    component: PreviousPalletDemo,
  },
  {
    id: "demo4-target-occupied",
    title: {
      zh: "目标点不空",
      ja: "納品先点位未空き",
    },
    subtitle: {
      zh: "目标点占用时等待、转缓存或报警",
      ja: "点位占有時に待機・バッファ・アラートを判断",
    },
    portalTag: {
      zh: "目标点校验",
      ja: "納品先判定",
    },
    path: "/demo4",
    durationMs: 15000,
    enabled: false,
    showInPortal: true,
    showInShowcase: true,
    component: PlaceholderDemo,
  },
  {
    id: "asrs-line-delivery",
    title: {
      zh: "立库 + 现编库 + 线边配送",
      ja: "自動倉庫 + 現編庫 + ラインサイド搬送",
    },
    subtitle: {
      zh: "立库货到出口后自动检测、判断点位并联动 AGV",
      ja: "出口到着後に検査・点位判定・AGV連携を自動化",
    },
    portalTag: {
      zh: "立库联动",
      ja: "自動倉庫連携",
    },
    path: "/asrs-line-demo",
    durationMs: 16000,
    enabled: true,
    showInPortal: true,
    showInShowcase: true,
    component: AsrsLineDeliveryDemo,
  },
  {
    id: "demo-placeholder-6",
    title: {
      zh: "待定 Demo 6",
      ja: "未定デモ 6",
    },
    subtitle: {
      zh: "后续补充",
      ja: "後日追加",
    },
    portalTag: {
      zh: "预留场景位",
      ja: "予約枠",
    },
    path: "/placeholder",
    durationMs: 12000,
    enabled: false,
    showInPortal: true,
    showInShowcase: true,
    component: PlaceholderDemo,
  },
  {
    id: "demo-placeholder-7",
    title: {
      zh: "待定 Demo 7",
      ja: "未定デモ 7",
    },
    subtitle: {
      zh: "后续补充",
      ja: "後日追加",
    },
    portalTag: {
      zh: "预留场景位",
      ja: "予約枠",
    },
    path: "/placeholder",
    durationMs: 12000,
    enabled: false,
    showInPortal: true,
    showInShowcase: true,
    component: PlaceholderDemo,
  },
  {
    id: "demo-placeholder-8",
    title: {
      zh: "待定 Demo 8",
      ja: "未定デモ 8",
    },
    subtitle: {
      zh: "后续补充",
      ja: "後日追加",
    },
    portalTag: {
      zh: "预留场景位",
      ja: "予約枠",
    },
    path: "/placeholder",
    durationMs: 12000,
    enabled: false,
    showInPortal: true,
    showInShowcase: true,
    component: PlaceholderDemo,
  },
];

export const portalDemoRegistry = demoRegistry.filter((demo) => demo.showInPortal);

export const showcaseDemoRegistry = demoRegistry.filter((demo) => demo.showInShowcase);

export function findDemoByPath(pathname: string) {
  return demoRegistry.find((demo) => demo.path === pathname);
}

export function findDemoByLegacyHash(hash: string) {
  return demoRegistry.find((demo) => demo.legacyHashes?.includes(hash));
}

export function findDemoById(id: string) {
  return demoRegistry.find((demo) => demo.id === id);
}
