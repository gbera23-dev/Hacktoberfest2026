import "../live.css";
import type { Bus, BusStop, Locale } from "../../../../../shared/api/src/index";
import { TtcMap } from "../../../shared/components/TtcMap";
import { useLiveRoute } from "../hooks/useLiveRoute";
import { LiveRouteSelector } from "../components/LiveRouteSelector";
import type { Labels } from "../../../shared/constants/translations";

type Props = { locale: Locale; labels: Labels; routes: Bus[]; selectedRoute?: Bus; mapStops: BusStop[]; trafficEnabled: boolean; onTrafficChange: (enabled: boolean) => void; onSelectRoute: (route?: Bus) => void };

export function LivePage({ locale, labels, routes, selectedRoute, mapStops, trafficEnabled, onTrafficChange, onSelectRoute }: Props) {
  const { routeStops, positions } = useLiveRoute(selectedRoute?.id, locale);
  return <section className="live-view">
    <LiveRouteSelector labels={labels} routes={routes} selectedRoute={selectedRoute} onSelect={onSelectRoute} errors={[routeStops.error, positions.error]} />
    <TtcMap locale={locale} stops={selectedRoute ? routeStops.data : mapStops} routeStops={selectedRoute ? routeStops.data : undefined} positions={positions.data} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} />
  </section>;
}
