import type { Locale } from "../../../../../shared/api/src/index";
import { useRoutePositions, useRouteStops } from "../../../shared/hooks/useTtcQueries";

export function useLiveRoute(routeId: string | undefined, locale: Locale) {
  const routeStops = useRouteStops(routeId, locale, true);
  const positions = useRoutePositions(routeId, true);
  return { routeStops, positions };
}
