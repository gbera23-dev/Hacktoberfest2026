import { useEffect, useState } from "react";
import type { Bus, BusStop, Locale } from "../../../../shared/api/src/index";
import { BUS_STOP_MARKER_LIMIT } from "../../shared/constants/application";
import { text } from "../../shared/constants/translations";
import { useRoutes, useStops } from "../../shared/hooks/useTtcQueries";
import { pathForScreen, screenFromPath, type Screen } from "../../shared/components/NavBar";

export function useApplication() {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [screen, setScreen] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [selectedStop, setSelectedStop] = useState<BusStop>();
  const [selectedRoute, setSelectedRoute] = useState<Bus>();
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const labels = locale === "en" ? text.en : text.ka;
  const stops = useStops(locale);
  const routes = useRoutes(locale);
  const activeStops = stops.data ?? [];
  const activeRoutes = routes.data ?? [];
  const mapStops = [
    ...activeStops.filter((stop) => stop.vehicleMode === "BUS").slice(0, BUS_STOP_MARKER_LIMIT),
    ...activeStops.filter((stop) => stop.vehicleMode !== "BUS"),
  ];

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { if (!selectedRoute && activeRoutes[0]) setSelectedRoute(activeRoutes[0]); }, [activeRoutes, selectedRoute]);
  useEffect(() => {
    const initialPath = pathForScreen(screen);
    if (window.location.pathname !== initialPath) window.history.replaceState({}, "", initialPath);
    const handlePopState = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextScreen: Screen) => {
    const nextPath = pathForScreen(nextScreen);
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
    setScreen(nextScreen);
  };

  return {
    locale, setLocale, theme, setTheme, screen, selectedStop, setSelectedStop,
    selectedRoute, setSelectedRoute, trafficEnabled, setTrafficEnabled, labels,
    stops, activeStops, activeRoutes, mapStops, navigate,
  };
}
