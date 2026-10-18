import type { Locale } from "../../../../../shared/api/src/index";
import { useRoutePolyline, useRoutePositions, useRouteStops } from "../../../shared/hooks/useTtcQueries";

export function useRouteDetails(routeId: string | undefined, locale: Locale) {
  const routeStops = useRouteStops(routeId, locale, true);
  const positions = useRoutePositions(routeId, true);
  const polyline = useRoutePolyline(routeId, true);
  return { routeStops, positions, polyline };
}
