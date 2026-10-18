import "../routes.css";
import type { Bus, Locale } from "../../../../../shared/api/src/index";
import { RouteList } from "../components/RouteList";
import { RouteDetails } from "../components/RouteDetails";
import type { Labels } from "../../../shared/constants/translations";

export function RoutesPage({ locale, labels, routes, selectedRoute, onSelect, trafficEnabled, onTrafficChange }: { locale: Locale; labels: Labels; routes: Bus[]; selectedRoute?: Bus; onSelect: (route: Bus) => void; trafficEnabled: boolean; onTrafficChange: (enabled: boolean) => void }) {
  return <section className="routes-page split-panel">
    <RouteList routes={routes} selectedRoute={selectedRoute} labels={labels} onSelect={onSelect} />
    <RouteDetails locale={locale} labels={labels} selectedRoute={selectedRoute} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} />
  </section>;
}
