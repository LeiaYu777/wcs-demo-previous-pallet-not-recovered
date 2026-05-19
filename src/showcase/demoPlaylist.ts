import type { ShowcaseDemoItem } from "./types";
import { showcaseDemoRegistry } from "./demoRegistry";

export const showcaseDemoPlaylist: ShowcaseDemoItem[] = showcaseDemoRegistry.map(({ id, title, subtitle, path, durationMs, enabled }) => ({
  id,
  title,
  subtitle,
  path,
  durationMs,
  enabled,
}));

export const enabledShowcaseDemoPlaylist = showcaseDemoPlaylist.filter((demo) => demo.enabled);
