import type { Bus, Locale } from "../../../../../shared/api/src/index";
import { TtcMap } from "../../../shared/components/TtcMap";
import type { Labels } from "../../../shared/constants/translations";
import { useRouteDetails } from "../hooks/useRouteDetails";

type Props = { locale: Locale; labels: Labels; selectedRoute?: Bus; trafficEnabled: boolean; onTrafficChange: (enabled: boolean) => void };

export function RouteDetails({ locale, labels, selectedRoute, trafficEnabled, onTrafficChange }: Props) {
  const { routeStops, positions, polyline } = useRouteDetails(selectedRoute?.id, locale);
  return <div className="route-details panel-detail">
    <TtcMap locale={locale} stops={routeStops.data} routeStops={routeStops.data} positions={positions.data} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} />
    {selectedRoute && <>
      <div className="detail-heading"><div><span className="eyebrow">{selectedRoute.shortName}</span><h2>{selectedRoute.longName}</h2></div></div>
      <p className="muted">{routeStops.data?.length ?? 0} {labels.stopsUnit} · {positions.data?.length ?? 0} {labels.vehiclesUnit} · {polyline.data ? labels.routeGeometry : labels.loading}</p>
    </>}
  </div>;
}
