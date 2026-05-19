import { useCallback, useEffect, useMemo, useState } from "react";
import DemoPortal from "./DemoPortal";
import { findDemoById, findDemoByLegacyHash, findDemoByPath } from "./showcase/demoRegistry";
import ShowcasePlayer from "./showcase/ShowcasePlayer";

type AppRoute = "home" | "showcase" | string;

function routeFromLocation(): AppRoute {
  if (window.location.pathname === "/showcase") return "showcase";

  const pathDemo = findDemoByPath(window.location.pathname);
  if (pathDemo) return pathDemo.id;

  const hash = window.location.hash.replace(/^#\/?/, "");
  const hashDemo = findDemoByLegacyHash(hash);
  if (hashDemo) return hashDemo.id;

  return "home";
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromLocation());

  useEffect(() => {
    const onLocationChange = () => setRoute(routeFromLocation());
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    return () => {
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
    };
  }, []);

  const openDemo = useCallback((path: string) => {
    window.history.pushState(null, "", path);
    setRoute(routeFromLocation());
  }, []);

  const goHome = useCallback(() => {
    window.history.pushState(null, "", "/");
    setRoute("home");
  }, []);

  const page = useMemo(() => {
    if (route === "showcase") return <ShowcasePlayer />;

    const demo = findDemoById(route);
    if (demo) {
      const DemoComponent = demo.component;
      return <DemoComponent onHome={goHome} />;
    }

    return <DemoPortal onOpenDemo={openDemo} />;
  }, [goHome, openDemo, route]);

  return page;
}
