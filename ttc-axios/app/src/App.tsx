import { useEffect, useMemo, useState } from "react";
import type { Bus, BusStop, LatLng, Locale } from "../../api/src/index";
import { Chatbot } from "./components/Chatbot";
import { NavBar, pathForScreen, screenFromPath, type Screen } from "./components/NavBar";
import { TtcMap } from "./components/TtcMap";
import { estimateAverageVelocity } from "./utils/velocity";
import {
  useRoutePolyline,
  useRoutePositions,
  useRouteStops,
  useRoutes,
  useStopArrivals,
  useStopRoutePositions,
  useStopRoutes,
  useStops,
  useTripPlan,
} from "./hooks/useTtcQueries";

const text = {
  en: { plan: "Plan a trip", stops: "Stops & arrivals", routes: "Routes", live: "Live buses", search: "Search stops", choose: "Choose a stop", chooseRoute: "Choose a route", loading: "Loading…", noData: "No data found", select: "Select", from: "From", to: "To", clickMap: "Click the map to set a location", setFrom: "Set origin", setTo: "Set destination", clear: "Clear", minutes: "min", realtime: "Live", scheduled: "Scheduled", departures: "Upcoming arrivals", map: "Network map", stopsLoaded: "stops loaded", noToken: "The proxy server must be running.", avgVelocity: "avg. km/h" },
  ka: { plan: "მარშრუტის დაგეგმვა", stops: "გაჩერებები და მოსვლები", routes: "მარშრუტები", live: "ავტობუსები რეალურ დროში", search: "გაჩერების ძიება", choose: "აირჩიეთ გაჩერება", chooseRoute: "აირჩიეთ მარშრუტი", loading: "იტვირთება…", noData: "მონაცემები ვერ მოიძებნა", select: "არჩევა", from: "საწყისი", to: "დანიშნულება", clickMap: "ადგილმდებარეობის ასარჩევად დააჭირეთ რუკას", setFrom: "საწყისი", setTo: "დანიშნულება", clear: "გასუფთავება", minutes: "წთ", realtime: "რეალური", scheduled: "გეგმიური", departures: "მოსალოდნელი ავტობუსები", map: "ქსელის რუკა", stopsLoaded: "გაჩერება ჩაიტვირთა", noToken: "პროქსი სერვერი გაშვებული უნდა იყოს.", avgVelocity: "საშ. კმ/სთ" },
} as const;
type Labels = { [Key in keyof typeof text.en]: string };

function ErrorMessage({ error }: { error: unknown }) {
  return <p className="error" role="alert">{error instanceof Error ? error.message : "Request failed"}</p>;
}

function StopPanel({ locale, labels, stops, selectedStop, onSelect }: { locale: Locale; labels: Labels; stops: BusStop[]; selectedStop?: BusStop; onSelect: (stop: BusStop) => void }) {
  const [search, setSearch] = useState("");
  const arrivals = useStopArrivals(selectedStop?.id, locale);
  const stopRoutes = useStopRoutes(selectedStop?.id, locale);
  const arrivalRouteNames = new Set(arrivals.data?.map((arrival) => arrival.shortName));
  const arrivalRoutes = stopRoutes.data?.filter((route) => arrivalRouteNames.has(route.shortName));
  const routePositions = useStopRoutePositions(arrivalRoutes, locale);
  const filtered = useMemo(() => stops.filter((stop) => `${stop.name} ${stop.code ?? ""}`.toLowerCase().includes(search.toLowerCase())).slice(0, 80), [stops, search]);
  const velocityFor = (shortName: string, minutes: number) => {
    if (!selectedStop || minutes <= 0) return undefined;
    const routeIndex = arrivalRoutes?.findIndex((route) => route.shortName === shortName) ?? -1;
    return routeIndex >= 0 ? estimateAverageVelocity(routePositions[routeIndex]?.data ?? [], selectedStop, minutes) : undefined;
  };

  return <section className="split-panel">
    <div className="panel-list">
      <label className="search"><span className="sr-only">{labels.search}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={labels.search} /></label>
      <div className="list-scroll">{filtered.map((stop) => <button className={`list-item ${selectedStop?.id === stop.id ? "selected" : ""}`} key={stop.id} onClick={() => onSelect(stop)}><strong>{stop.name}</strong><small>{stop.code ?? stop.id}</small></button>)}{filtered.length === 0 && <p className="muted">{labels.noData}</p>}</div>
    </div>
    <div className="panel-detail">
      {!selectedStop && <p className="empty">{labels.choose}</p>}
      {selectedStop && <>
        <div className="detail-heading"><div><span className="eyebrow">{selectedStop.code ?? selectedStop.id}</span><h2>{selectedStop.name}</h2></div><span className="mode-pill">{selectedStop.vehicleMode}</span></div>
        <h3>{labels.departures}</h3>
        {arrivals.isLoading && <p className="muted">{labels.loading}</p>}
        {arrivals.error && <ErrorMessage error={arrivals.error} />}
        <div className="arrivals">{arrivals.data?.map((arrival, index) => { const velocity = velocityFor(arrival.shortName, arrival.realtimeArrivalMinutes); return <div className="arrival" key={`${arrival.shortName}-${index}`}><span className="arrival-route" aria-label={`Bus ${arrival.shortName}, ${arrival.realtimeArrivalMinutes} ${labels.minutes}`}><span className="route-badge" style={{ background: arrival.color || "#0f766e" }}>{arrival.shortName}</span><strong>Bus {arrival.shortName} · {arrival.realtimeArrivalMinutes} {labels.minutes}</strong></span><span>{arrival.headsign}</span><small>{arrival.realtime ? <><span className="realtime-signal" aria-label={labels.realtime}><i /><i /><i /></span>{labels.realtime}</> : labels.scheduled}{velocity !== undefined && <span className="velocity"> · {velocity} {labels.avgVelocity}</span>}</small></div>; })}</div>
        <h3>Routes</h3>
        {stopRoutes.data?.map((route) => <span className="route-chip" key={route.id}>{route.shortName} · {route.longName}</span>)}
      </>}
    </div>
  </section>;
}

function RoutePanel({ locale, labels, routes, selectedRoute, onSelect, trafficEnabled, onTrafficChange }: { locale: Locale; labels: Labels; routes: Bus[]; selectedRoute?: Bus; onSelect: (route: Bus) => void; trafficEnabled: boolean; onTrafficChange: (enabled: boolean) => void }) {
  const routeStops = useRouteStops(selectedRoute?.id, locale, true);
  const positions = useRoutePositions(selectedRoute?.id, true);
  const polyline = useRoutePolyline(selectedRoute?.id, true);
  return <section className="split-panel">
    <div className="panel-list"><div className="list-scroll">{routes.map((route) => <button className={`list-item ${selectedRoute?.id === route.id ? "selected" : ""}`} key={route.id} onClick={() => onSelect(route)}><span className="route-badge" style={{ background: route.color || "#0f766e" }}>{route.shortName}</span><span><strong>{route.longName}</strong><small>{route.mode}</small></span></button>)}{routes.length === 0 && <p className="muted">{labels.noData}</p>}</div></div>
    <div className="panel-detail"><TtcMap stops={routeStops.data} routeStops={routeStops.data} positions={positions.data} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} />{selectedRoute && <><div className="detail-heading"><div><span className="eyebrow">{selectedRoute.shortName}</span><h2>{selectedRoute.longName}</h2></div></div><p className="muted">{routeStops.data?.length ?? 0} stops · {positions.data?.length ?? 0} live vehicles · {polyline.data ? "route geometry loaded" : labels.loading}</p></>}</div>
  </section>;
}

function Planner({ locale, labels, stops, trafficEnabled, onTrafficChange }: { locale: Locale; labels: Labels; stops: BusStop[]; trafficEnabled: boolean; onTrafficChange: (enabled: boolean) => void }) {
  const [from, setFrom] = useState<LatLng>();
  const [to, setTo] = useState<LatLng>();
  const [pick, setPick] = useState<"from" | "to">("from");
  const plan = useTripPlan(from, to, locale);
  const pickPoint = (point: LatLng) => pick === "from" ? setFrom(point) : setTo(point);
  return <section className="planner"><div className="planner-controls"><h2>{labels.plan}</h2><p className="muted">{labels.clickMap}</p><div className="coordinate-row"><button className={pick === "from" ? "active" : ""} onClick={() => setPick("from")}>{labels.setFrom}<small>{from ? `${from[0].toFixed(5)}, ${from[1].toFixed(5)}` : "—"}</small></button><button className={pick === "to" ? "active" : ""} onClick={() => setPick("to")}>{labels.setTo}<small>{to ? `${to[0].toFixed(5)}, ${to[1].toFixed(5)}` : "—"}</small></button></div><button className="text-button" onClick={() => { setFrom(undefined); setTo(undefined); }}>{labels.clear}</button><div className="itineraries">{plan.isLoading && <p className="muted">{labels.loading}</p>}{plan.error && <ErrorMessage error={plan.error} />}{plan.data?.itineraries.map((itinerary, index) => <article className="itinerary" key={index}><strong>{Math.round(itinerary.duration / 60)} {labels.minutes}</strong><span>{itinerary.legs.map((leg) => leg.mode).join(" → ")}</span><small>{itinerary.legs.map((leg) => leg.route?.shortName).filter(Boolean).join(" · ") || "Walk"}</small></article>)}</div></div><TtcMap stops={stops} from={from} to={to} onPick={pickPoint} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} /></section>;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [screen, setScreen] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [selectedStop, setSelectedStop] = useState<BusStop>();
  const [selectedRoute, setSelectedRoute] = useState<Bus>();
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const labels = locale === "en" ? text.en : text.ka;
  const stops = useStops(locale);
  const routes = useRoutes(locale);
  const liveRouteStops = useRouteStops(selectedRoute?.id, locale, true);
  const livePositions = useRoutePositions(selectedRoute?.id, true);
  const activeStops = stops.data ?? [];
  const activeRoutes = routes.data ?? [];
  // Keep the map lightweight by capping bus markers, while always showing all
  // subway and gondola stops. The API orders most non-bus stops after buses.
  const mapStops = [
    ...activeStops.filter((stop) => stop.vehicleMode === "BUS").slice(0, 250),
    ...activeStops.filter((stop) => stop.vehicleMode !== "BUS"),
  ];

  useEffect(() => {
    if (!selectedRoute && activeRoutes[0]) setSelectedRoute(activeRoutes[0]);
  }, [activeRoutes, selectedRoute]);

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

  return <div className="app-shell"><header className="topbar"><button className="brand" type="button" aria-label={labels.plan} onClick={() => { navigate("plan"); setSelectedStop(undefined); }}><span className="brand-mark">T</span><span><strong>Tbilisi Transit</strong><small>TTC network</small></span></button><NavBar screen={screen} labels={{ plan: labels.plan, stops: labels.stops, routes: labels.routes, live: labels.live }} onNavigate={navigate} /><button className="language" onClick={() => setLocale(locale === "en" ? "ka" : "en")}>{locale === "en" ? "ქარ" : "ENG"}</button></header>
    <main className="content"><div className="page-heading"><div><span className="eyebrow">TTC · Tbilisi</span><h1>{labels[screen]}</h1></div><span className="status-dot"><i /> {stops.isFetching ? labels.loading : `${activeStops.length} ${labels.stopsLoaded}`}</span></div>
      {stops.error && <ErrorMessage error={stops.error} />}
      {screen === "plan" && <Planner locale={locale} labels={labels} stops={mapStops} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} />}
      {screen === "stops" && <><TtcMap stops={mapStops} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} onStopSelect={setSelectedStop} /><StopPanel locale={locale} labels={labels} stops={activeStops} selectedStop={selectedStop} onSelect={setSelectedStop} /></>}
      {screen === "routes" && <RoutePanel locale={locale} labels={labels} routes={activeRoutes} selectedRoute={selectedRoute} onSelect={setSelectedRoute} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} />}
      {screen === "live" && <section className="live-view"><div className="live-controls"><h2>{labels.live}</h2><select value={selectedRoute?.id ?? ""} onChange={(event) => setSelectedRoute(activeRoutes.find((route) => route.id === event.target.value))}><option value="">{labels.chooseRoute}</option>{activeRoutes.map((route) => <option value={route.id} key={route.id}>{route.shortName} · {route.longName}</option>)}</select><p className="muted">Live positions refresh every 15 seconds.</p>{livePositions.error && <ErrorMessage error={livePositions.error} />}</div><TtcMap stops={selectedRoute ? liveRouteStops.data : mapStops} routeStops={selectedRoute ? liveRouteStops.data : undefined} positions={livePositions.data} trafficEnabled={trafficEnabled} onTrafficChange={setTrafficEnabled} /></section>}
    </main><Chatbot locale={locale} screen={screen} selectedStop={selectedStop} selectedRoute={selectedRoute} /></div>;
}
