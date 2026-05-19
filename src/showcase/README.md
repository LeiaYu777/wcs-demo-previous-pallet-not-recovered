# Showcase Demo 接入说明

后续新增展会 Demo 时，只需要完成两个动作：

1. 新建独立 Demo 页面组件，例如 `src/demos/DemoXSomething.tsx`。
2. 在 `src/showcase/demoRegistry.ts` 中注册一条 Demo 配置。

示例：

```ts
{
  id: "demo-x-something",
  title: {
    zh: "某某场景",
    ja: "XXXシーン",
  },
  subtitle: {
    zh: "中文说明",
    ja: "日本語説明",
  },
  portalTag: {
    zh: "场景标签",
    ja: "シーンタグ",
  },
  path: "/demo-x-something",
  durationMs: 15000,
  enabled: true,
  showInPortal: true,
  showInShowcase: true,
  component: DemoXSomething,
}
```

字段说明：

- `path`：独立访问路径，也是 Showcase iframe 加载路径。
- `enabled`：是否可点击、是否参与自动轮播。
- `showInPortal`：是否显示在首页入口。
- `showInShowcase`：是否显示在 Showcase 播放清单。
- `durationMs`：父播放器兜底切换时间。
- `component`：该 Demo 的 React 页面组件。

Demo 页面如果要接入无人值守轮播，应使用 `useShowcaseMode` 支持：

- `lang=zh|ja`
- `autoplay=1`
- `loop=0|1`
- `hideControls=1`
- 播放完成后发送 `DEMO_COMPLETED`
