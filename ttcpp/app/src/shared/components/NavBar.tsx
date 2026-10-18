export type Screen = "plan" | "stops" | "routes" | "live";

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
  return <nav aria-label={navigationLabel}>{screens.map((item) => <button className={screen === item ? "active" : ""} key={item} onClick={() => onNavigate(item)}>{labels[item]}</button>)}</nav>;
}
