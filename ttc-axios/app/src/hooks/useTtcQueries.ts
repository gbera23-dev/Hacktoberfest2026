import { useQueries, useQuery } from "@tanstack/react-query";
import { getGoogleTransitRoutes, ttc } from "../ttc";
import type { LatLng, Locale } from "../../../api/src/index";

export const useStops = (locale: Locale) => useQuery({
  queryKey: ["stops", locale],
  queryFn: () => ttc.stops.list(locale),
  staleTime: 10 * 60_000,
});

export const useStopArrivals = (stopId: string | undefined, locale: Locale) => useQuery({
  queryKey: ["arrivals", stopId, locale],
  queryFn: () => ttc.stops.arrivals(stopId!, { locale }),
  enabled: Boolean(stopId),
  refetchInterval: 15_000,
});

export const useStopRoutes = (stopId: string | undefined, locale: Locale) => useQuery({
  queryKey: ["stop-routes", stopId, locale],
  queryFn: () => ttc.stops.routes(stopId!, locale),
  enabled: Boolean(stopId),
  staleTime: 10 * 60_000,
});

export const useRoutes = (locale: Locale) => useQuery({
  queryKey: ["routes", locale],
  queryFn: () => ttc.routes.list(locale),
  staleTime: 10 * 60_000,
});

export const useRouteStops = (routeId: string | undefined, locale: Locale, forward: boolean) => useQuery({
  queryKey: ["route-stops", routeId, locale, forward],
  queryFn: () => ttc.routes.stops(routeId!, forward, locale),
  enabled: Boolean(routeId),
  staleTime: 10 * 60_000,
});

export const useRoutePolyline = (routeId: string | undefined, forward: boolean) => useQuery({
  queryKey: ["route-polyline", routeId, forward],
  queryFn: () => ttc.routes.polyline(routeId!, forward),
  enabled: Boolean(routeId),
  staleTime: 10 * 60_000,
});

export const useRoutePositions = (routeId: string | undefined, forward: boolean) => useQuery({
  queryKey: ["route-positions", routeId, forward],
  queryFn: () => ttc.routes.positions(routeId!, forward),
  enabled: Boolean(routeId),
  refetchInterval: 15_000,
});

export const useStopRoutePositions = (routes: { id: string }[] | undefined, locale: Locale) => useQueries({
  queries: (routes ?? []).map((route) => ({
    queryKey: ["stop-route-positions", route.id, locale],
    queryFn: () => ttc.routes.positions(route.id, true),
    enabled: Boolean(route.id),
    retry: 0,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })),
});

export const useTripPlan = (from: LatLng | undefined, to: LatLng | undefined, locale: Locale) => useQuery({
  queryKey: ["plan", from, to, locale],
  queryFn: () => ttc.trips.plan(from!, to!, locale),
  enabled: Boolean(from && to),
  staleTime: 30_000,
});

export const useGoogleTransitRoutes = (from: LatLng | undefined, to: LatLng | undefined, locale: Locale) => useQuery({
  queryKey: ["google-transit-routes", from, to, locale],
  queryFn: () => getGoogleTransitRoutes(from!, to!, locale),
  enabled: Boolean(from && to),
  retry: 0,
  staleTime: 30_000,
});
