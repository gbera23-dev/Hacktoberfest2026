import { useEffect, useState } from "react";

export type Screen = "plan" | "stops" | "routes" | "live";
type DisplayMode = "auto" | "desktop" | "mobile";

const screens: Screen[] = ["plan", "stops", "routes", "live"];

export function screenFromPath(pathname: string): Screen {
  const path = pathname.replace(/\/+$/, "") || "/plan";
  return screens.includes(path.slice(1) as Screen) ? path.slice(1) as Screen : "plan";
}

export function pathForScreen(screen: Screen): string {
  return `/${screen}`;
}

type Props = {
  screen: Screen;
  labels: Record<Screen, string>;
  navigationLabel?: string;
  onNavigate: (screen: Screen) => void;
};

export function NavBar({ screen, labels, navigationLabel = "Primary navigation", onNavigate }: Props) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = window.localStorage.getItem("ttc-display-mode");
    return saved === "desktop" || saved === "mobile" ? saved : "auto";
  });
  const georgian = typeof document !== "undefined" && document.documentElement.lang === "ka";
  const modeLabels = georgian ? { label: "ჩვენების რეჟიმი", auto: "ავტომატური", desktop: "დესკტოპი", mobile: "მობილური" } : { label: "Display mode", auto: "Automatic", desktop: "Desktop", mobile: "Mobile" };

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode;
    if (displayMode === "auto") window.localStorage.removeItem("ttc-display-mode");
    else window.localStorage.setItem("ttc-display-mode", displayMode);
  }, [displayMode]);

  return <><nav aria-label={navigationLabel}>{screens.map((item) => <button className={screen === item ? "active" : ""} key={item} onClick={() => onNavigate(item)}>{labels[item]}</button>)}</nav><label className="display-mode-select"><span className="sr-only">{modeLabels.label}</span><select value={displayMode} onChange={(event) => setDisplayMode(event.target.value as DisplayMode)} aria-label={modeLabels.label}><option value="auto">◌ {modeLabels.auto}</option><option value="desktop">▣ {modeLabels.desktop}</option><option value="mobile">▯ {modeLabels.mobile}</option></select></label></>;
}
