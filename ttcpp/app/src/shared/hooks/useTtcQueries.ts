import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { getGoogleRouteComparison, getGoogleTransitRoutes, searchGooglePlaces, simulateDepartures, ttc, type WhatIfRequest } from "../services/ttc";
import type { LatLng, Locale } from "../../../../shared/api/src/index";
import { GOOGLE_PLACES_STALE_TIME_MS, GOOGLE_SEARCH_MIN_LENGTH, ARRIVAL_REFRESH_INTERVAL_MS, ROUTE_POSITION_REFRESH_INTERVAL_MS, STOP_ROUTE_POSITION_REFRESH_INTERVAL_MS, QUERY_RETRY_COUNT, QUERY_STALE_TIME_MS, STOP_POSITION_STALE_TIME_MS, TRIP_PLAN_STALE_TIME_MS } from "../constants/query";

export const useStops = (locale: Locale) => useQuery({
  queryKey: ["stops", locale],
  queryFn: () => ttc.stops.list(locale),
  retry: QUERY_RETRY_COUNT,
  staleTime: QUERY_STALE_TIME_MS,
});

export const useStopArrivals = (stopId: string | undefined, locale: Locale) => useQuery({
  queryKey: ["arrivals", stopId, locale],
  queryFn: () => ttc.stops.arrivals(stopId!, { locale }),
  enabled: Boolean(stopId),
  refetchInterval: ARRIVAL_REFRESH_INTERVAL_MS,
});

export const useStopRoutes = (stopId: string | undefined, locale: Locale) => useQuery({
  queryKey: ["stop-routes", stopId, locale],
  queryFn: () => ttc.stops.routes(stopId!, locale),
  enabled: Boolean(stopId),
  retry: QUERY_RETRY_COUNT,
  staleTime: QUERY_STALE_TIME_MS,
});

export const useRoutes = (locale: Locale) => useQuery({
  queryKey: ["routes", locale],
  queryFn: () => ttc.routes.list(locale),
  retry: QUERY_RETRY_COUNT,
  staleTime: QUERY_STALE_TIME_MS,
});

export const useRouteStops = (routeId: string | undefined, locale: Locale, forward: boolean) => useQuery({
  queryKey: ["route-stops", routeId, locale, forward],
  queryFn: () => ttc.routes.stops(routeId!, forward, locale),
  enabled: Boolean(routeId),
  retry: QUERY_RETRY_COUNT,
  staleTime: QUERY_STALE_TIME_MS,
});

export const useRoutePolyline = (routeId: string | undefined, forward: boolean) => useQuery({
  queryKey: ["route-polyline", routeId, forward],
  queryFn: () => ttc.routes.polyline(routeId!, forward),
  enabled: Boolean(routeId),
  retry: QUERY_RETRY_COUNT,
  staleTime: QUERY_STALE_TIME_MS,
});

export const useRoutePositions = (routeId: string | undefined, forward: boolean) => useQuery({
  queryKey: ["route-positions", routeId, forward],
  queryFn: () => ttc.routes.positions(routeId!, forward),
  enabled: Boolean(routeId),
  refetchInterval: ROUTE_POSITION_REFRESH_INTERVAL_MS,
});

export const useStopRoutePositions = (routes: { id: string }[] | undefined, locale: Locale) => useQueries({
  queries: (routes ?? []).map((route) => ({
    queryKey: ["stop-route-positions", route.id, locale],
    queryFn: () => ttc.routes.positions(route.id, true),
    enabled: Boolean(route.id),
    retry: 0,
    staleTime: STOP_POSITION_STALE_TIME_MS,
    refetchInterval: STOP_ROUTE_POSITION_REFRESH_INTERVAL_MS,
  })),
});

export const useTripPlan = (from: LatLng | undefined, to: LatLng | undefined, locale: Locale) => useQuery({
  queryKey: ["plan", from, to, locale],
  queryFn: () => ttc.trips.plan(from!, to!, locale),
  enabled: Boolean(from && to),
  staleTime: TRIP_PLAN_STALE_TIME_MS,
});

export const useGoogleTransitRoutes = (from: LatLng | undefined, to: LatLng | undefined, locale: Locale) => useQuery({
  queryKey: ["google-transit-routes", from, to, locale],
  queryFn: () => getGoogleTransitRoutes(from!, to!, locale),
  enabled: Boolean(from && to),
  retry: 0,
  staleTime: TRIP_PLAN_STALE_TIME_MS,
});

export const useGoogleRouteComparison = (from: LatLng | undefined, to: LatLng | undefined, locale: Locale) => useQuery({
  queryKey: ["google-route-comparison", from, to, locale],
  queryFn: () => getGoogleRouteComparison(from!, to!, locale),
  enabled: Boolean(from && to),
  retry: 0,
  staleTime: TRIP_PLAN_STALE_TIME_MS,
});

export const useGooglePlaces = (query: string, locale: Locale, center?: LatLng) => useQuery({
  queryKey: ["google-places", query, locale, center],
  queryFn: () => searchGooglePlaces(query, locale, center),
  enabled: query.trim().length >= GOOGLE_SEARCH_MIN_LENGTH,
  retry: 0,
  staleTime: GOOGLE_PLACES_STALE_TIME_MS,
});

export const useWhatIfSimulator = () => useMutation({ mutationFn: (request: WhatIfRequest) => simulateDepartures(request) });
