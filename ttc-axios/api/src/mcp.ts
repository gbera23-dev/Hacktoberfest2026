import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Bus, BusPlan, BusStop, Locale } from "./types.js";
import type { TtcApi } from "./TtcApi.js";
import type { GoogleMapsApi } from "./GoogleMapsApi.js";

const localeSchema = z.enum(["en", "ka"]).default("en");

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

type StaticCache = { stops: Map<Locale, Promise<BusStop[]>>; routes: Map<Locale, Promise<Bus[]>> };
const staticCaches = new WeakMap<TtcApi, StaticCache>();

function cacheFor(ttc: TtcApi): StaticCache {
  const existing = staticCaches.get(ttc);
  if (existing) return existing;
  const cache: StaticCache = { stops: new Map(), routes: new Map() };
  staticCaches.set(ttc, cache);
  return cache;
}

function compactStop(stop: BusStop) {
  return { id: stop.id, code: stop.code, name: stop.name, vehicleMode: stop.vehicleMode, lat: stop.lat, lon: stop.lon };
}

function compactPlan(plan: BusPlan) {
  return {
    itineraries: plan.itineraries.slice(0, 3).map((itinerary) => ({
      durationMinutes: Math.round(itinerary.duration / 60),
      walkMinutes: Math.round(itinerary.walkTime / 60),
      walkDistanceMeters: Math.round(itinerary.walkDistance),
      legs: itinerary.legs.map((leg) => ({
        mode: leg.mode,
        durationMinutes: Math.round(leg.duration / 60),
        distanceMeters: Math.round(leg.distance),
        route: leg.route && { shortName: leg.route.shortName, longName: leg.route.longName, mode: leg.route.mode },
        from: leg.from.name,
        to: leg.to.name,
        intermediateStops: leg.intermediateStops?.slice(0, 8).map((stop) => stop.name) ?? [],
      })),
    })),
  };
}

function compactGeocode(result: { placeId: string; formattedAddress: string; location: { latitude: number; longitude: number }; types: string[] }) {
  return { placeId: result.placeId, address: result.formattedAddress, lat: result.location.latitude, lon: result.location.longitude, types: result.types };
}

function searchStops(stops: BusStop[], query: string) {
  const needle = query.trim().toLocaleLowerCase();
  const terms = needle.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 2 && !["the", "of", "and", "street", "st"].includes(term));
  const genericTerms = new Set(["metro", "station", "stop", "bus", "university", "street", "tbilisi", "city"]);
  const meaningfulTerms = terms.filter((term) => !genericTerms.has(term));
  const rankingTerms = meaningfulTerms.length > 0 ? meaningfulTerms : terms;
  return stops.map((stop) => {
    const text = `${stop.name} ${stop.code ?? ""} ${stop.vehicleMode}`.toLocaleLowerCase();
    const candidateTokens = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const exactScore = needle && text.includes(needle) ? 1000 : 0;
    const tokenScore = rankingTerms.reduce((score, term) => {
      const variants = [term, term.replace(/(იდან|ამდე|მდე|თან|თვის|ზე|ში|ის|ებს|ს)$/u, ""), term.slice(0, Math.max(4, Math.ceil(term.length * 0.6)))];
      const matchedVariants = variants.filter((variant) => variant.length > 2 && candidateTokens.some((candidate) => candidate === variant || (term.length >= 5 && candidate.startsWith(variant))));
      return score + Math.max(...matchedVariants.map((variant) => variant.length), 0);
    }, 0);
    const metroQuery = /metro|subway|მეტრო/i.test(needle);
    const metroScore = metroQuery && stop.vehicleMode === "SUBWAY" ? 100 : 0;
    const meaningfulMatch = meaningfulTerms.length === 0 || meaningfulTerms.some((term) => candidateTokens.some((candidate) => candidate === term || (term.length >= 5 && candidate.startsWith(term))));
    return { stop, score: meaningfulMatch ? exactScore + tokenScore + metroScore : 0 };
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score).slice(0, 20).map(({ stop }) => stop);
}

async function buildMcpServer(ttc: TtcApi, googleMaps?: GoogleMapsApi) {
  const server = new McpServer({ name: "ttc-transit-tools", version: "1.0.0" });
  const cache = cacheFor(ttc);
  const stopsFor = async (locale: Locale) => {
    const cached = cache.stops.get(locale);
    if (cached) return cached;
    const request = ttc.stops.list(locale).catch((error) => { cache.stops.delete(locale); throw error; });
    cache.stops.set(locale, request);
    return request;
  };
  const routesFor = async (locale: Locale) => {
    const cached = cache.routes.get(locale);
    if (cached) return cached;
    const request = ttc.routes.list(locale).catch((error) => { cache.routes.delete(locale); throw error; });
    cache.routes.set(locale, request);
    return request;
  };
  const stopsForSearch = async (locale: Locale) => {
    const [primary, secondary] = await Promise.all([stopsFor(locale), stopsFor(locale === "en" ? "ka" : "en")]);
    return [...primary, ...secondary];
  };

  const geocode = async (query: string, locale: Locale) => {
    if (!googleMaps) return undefined;
    try {
      const response = await googleMaps.geocoding.geocode(query, { language: locale, region: "ge" });
      const first = response.results[0];
      return first ? compactGeocode(first) : undefined;
    } catch {
      return undefined;
    }
  };

  server.registerTool("search_stops", {
    title: "Search TTC stops",
    description: "Find Tbilisi TTC stops by name, code, or transport mode.",
    inputSchema: { query: z.string().min(1), locale: localeSchema },
  }, async ({ query, locale }) => result({ stops: searchStops(await stopsForSearch(locale), query) }));

  server.registerTool("get_arrivals", {
    title: "Get TTC stop arrivals",
    description: "Get upcoming live TTC arrivals for a stop code or stop id.",
    inputSchema: { stopId: z.string().min(1), locale: localeSchema },
  }, async ({ stopId, locale }) => result({ arrivals: await ttc.stops.arrivals(stopId, { locale }) }));

  server.registerTool("get_network_summary", {
    title: "Get TTC network summary",
    description: "Count registered TTC routes and stops by transport mode.",
    inputSchema: { locale: localeSchema },
  }, async ({ locale }) => {
    const [stops, routes] = await Promise.all([stopsFor(locale), routesFor(locale)]);
    const stopsByMode = stops.reduce<Record<string, number>>((counts, stop) => {
      counts[stop.vehicleMode] = (counts[stop.vehicleMode] ?? 0) + 1;
      return counts;
    }, {});
    const routesByMode = routes.reduce<Record<string, number>>((counts, route) => {
      counts[route.mode] = (counts[route.mode] ?? 0) + 1;
      return counts;
    }, {});
    return result({ totalRoutes: routes.length, routesByMode, totalStops: stops.length, stopsByMode });
  });

  server.registerTool("list_routes", {
    title: "List TTC routes",
    description: "Find TTC bus routes by route number or name.",
    inputSchema: { query: z.string().optional(), locale: localeSchema },
  }, async ({ query, locale }) => {
    const routes = await routesFor(locale);
    const needle = query?.trim().toLocaleLowerCase();
    return result({ routes: (needle ? routes.filter((route) => `${route.shortName} ${route.longName}`.toLocaleLowerCase().includes(needle)) : routes).slice(0, 30) });
  });

  server.registerTool("geocode_place", {
    title: "Geocode a destination",
    description: "Resolve a landmark, university, mall, public place, street, or other destination in or near Tbilisi to coordinates.",
    inputSchema: { query: z.string().min(1), locale: localeSchema },
  }, async ({ query, locale }) => result({ place: await geocode(query, locale) }));

  server.registerTool("plan_trip", {
    title: "Plan a TTC trip",
    description: "Plan a trip between two TTC stop names, stop codes, or lat,lon coordinates.",
    inputSchema: { from: z.string().min(1), to: z.string().min(1), locale: localeSchema },
  }, async ({ from, to, locale }) => {
    const stops = await stopsForSearch(locale);
    const resolve = async (place: string) => {
      const coordinates = place.split(",").map(Number);
      if (coordinates.length === 2 && coordinates.every(Number.isFinite)) return { point: coordinates as [number, number] };
      const matches = searchStops(stops, place);
      if (matches.length > 0) return { point: [matches[0].lat, matches[0].lon] as [number, number], stop: matches[0], alternatives: matches.slice(1, 5).map(({ id, code, name, lat, lon, vehicleMode }) => ({ id, code, name, lat, lon, vehicleMode })) };
      const placeResult = await geocode(place, locale);
      if (placeResult) return { point: [placeResult.lat, placeResult.lon] as [number, number], place: placeResult };
      return { matches: [] };
    };
    const [origin, destination] = await Promise.all([resolve(from), resolve(to)]);
    if (!origin.point || !destination.point) return result({ needsSelection: true, from: origin, to: destination });
    const plan: BusPlan = await ttc.trips.plan(origin.point, destination.point, locale);
    return result({ from: origin.stop ? compactStop(origin.stop) : origin.place ?? { lat: origin.point[0], lon: origin.point[1] }, to: destination.stop ? compactStop(destination.stop) : destination.place ?? { lat: destination.point[0], lon: destination.point[1] }, plan: compactPlan(plan) });
  });

  return server;
}

export async function connectTtcMcp(ttc: TtcApi, googleMaps?: GoogleMapsApi) {
  const server = await buildMcpServer(ttc, googleMaps);
  const client = new Client({ name: "ttc-transit-chatbot", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, close: async () => { await client.close(); await server.close(); } };
}
