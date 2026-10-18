import { Chatbot } from "../shared/overlays/Chatbot";
import { ErrorMessage } from "../shared/components/ErrorMessage";
import { NavBar } from "../shared/components/NavBar";
import { PlanPage } from "../features/plan/pages/PlanPage";
import { StopsPage } from "../features/stops/pages/StopsPage";
import { RoutesPage } from "../features/routes/pages/RoutesPage";
import { LivePage } from "../features/live/pages/LivePage";
import { useApplication } from "./hooks/useApplication";
import type { Locale } from "../../../shared/api/src/index";

export default function App() {
  const {
    locale, setLocale, theme, setTheme, screen, selectedStop, setSelectedStop,
    selectedRoute, setSelectedRoute, trafficEnabled, setTrafficEnabled, labels,
    stops, activeStops, activeRoutes, mapStops, navigate,
  } = useApplication();

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" type="button" aria-label={labels.plan} onClick={() => { navigate("plan"); setSelectedStop(undefined); }}>
        <span className="brand-mark">T</span><span><strong>Tbilisi Transit</strong><small>TTC network</small></span>
      </button>
      <NavBar screen={screen} labels={{ plan: labels.plan, stops: labels.stops, routes: labels.routes, live: labels.live }} navigationLabel={labels.navigation} onNavigate={navigate} />
      <label className="language-select"><span className="sr-only">{labels.language}</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={labels.language}><option value="en">English</option><option value="ka">ქართული</option></select></label>
      <label className="language-select theme-select"><span className="sr-only">{labels.theme}</span><select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark")} aria-label={labels.theme}><option value="light">☀ {labels.light}</option><option value="dark">◐ {labels.dark}</option></select></label>
    </header>
    <main className="content">
      <div className="page-heading"><div><span className="eyebrow">TTC · Tbilisi</span><h1>{labels[screen]}</h1></div><span className="status-dot"><i /> {stops.isFetching ? labels.loading : `${activeStops.length} ${labels.stopsLoaded}`}</span></div>
      {stops.error && <ErrorMessage error={stops.error} />}
      {screen === "plan" && <PlanPage locale={locale} labels={labels} stops={mapStops} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} />}
      {screen === "stops" && <StopsPage locale={locale} labels={labels} stops={activeStops} mapStops={mapStops} selectedStop={selectedStop} onSelect={setSelectedStop} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} />}
      {screen === "routes" && <RoutesPage locale={locale} labels={labels} routes={activeRoutes} selectedRoute={selectedRoute} onSelect={setSelectedRoute} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} />}
      {screen === "live" && <LivePage locale={locale} labels={labels} routes={activeRoutes} selectedRoute={selectedRoute} mapStops={mapStops} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} onSelectRoute={setSelectedRoute} />}
    </main>
    <Chatbot locale={locale} screen={screen} selectedStop={selectedStop} selectedRoute={selectedRoute} />
  </div>;
}
