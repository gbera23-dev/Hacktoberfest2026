import { useMemo } from "react";
import type { BusStop, Locale } from "../../../../../shared/api/src/index";
import { estimateAverageVelocity } from "../../../shared/utils/velocity";
import { useStopArrivals, useStopRoutePositions, useStopRoutes } from "../../../shared/hooks/useTtcQueries";

export function useStopPanelData(locale: Locale, stops: BusStop[], selectedStop: BusStop | undefined, search: string) {
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
  return { arrivals, stopRoutes, arrivalRoutes, routePositions, filtered, velocityFor };
}
