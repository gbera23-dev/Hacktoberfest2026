import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BusPlan, BusStop, Locale } from "./types.js";
import type { TtcApi } from "./TtcApi.js";

const localeSchema = z.enum(["en", "ka"]).default("en");

function result(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

function searchStops(stops: BusStop[], query: string) {
  const needle = query.trim().toLocaleLowerCase();
  const terms = needle.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 2 && !["the", "of", "and", "street", "st"].includes(term));
  return stops.map((stop) => {
    const text = `${stop.name} ${stop.code ?? ""} ${stop.vehicleMode}`.toLocaleLowerCase();
    const exactScore = needle && text.includes(needle) ? 1000 : 0;
    const tokenScore = terms.reduce((score, term) => {
      const variants = [term, term.replace(/(იდან|ამდე|მდე|თან|თვის|ზე|ში|ის|ებს|ს)$/u, ""), term.slice(0, Math.max(4, Math.ceil(term.length * 0.6)))];
      return score + Math.max(...variants.filter((variant) => variant.length > 2 && text.includes(variant)).map((variant) => variant.length), 0);
    }, 0);
    const metroQuery = /metro|subway|მეტრო/i.test(needle);
    const metroScore = metroQuery && (stop.vehicleMode === "SUBWAY" || /m\/s|მ\/ს/i.test(stop.name)) ? 100 : 0;
    return { stop, score: exactScore + tokenScore + metroScore };
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score).slice(0, 20).map(({ stop }) => stop);
}

async function buildMcpServer(ttc: TtcApi) {
  const server = new McpServer({ name: "ttc-transit-tools", version: "1.0.0" });
  const stopCache = new Map<Locale, BusStop[]>();
  const stopsFor = async (locale: Locale) => {
    const cached = stopCache.get(locale);
    if (cached) return cached;
    const stops = await ttc.stops.list(locale);
    stopCache.set(locale, stops);
    return stops;
  };
  const stopsForSearch = async (locale: Locale) => [...await stopsFor(locale), ...await stopsFor(locale === "en" ? "ka" : "en")];

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
    const [stops, routes] = await Promise.all([stopsFor(locale), ttc.routes.list(locale)]);
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
    const routes = await ttc.routes.list(locale);
    const needle = query?.trim().toLocaleLowerCase();
    return result({ routes: (needle ? routes.filter((route) => `${route.shortName} ${route.longName}`.toLocaleLowerCase().includes(needle)) : routes).slice(0, 30) });
  });

  server.registerTool("plan_trip", {
    title: "Plan a TTC trip",
    description: "Plan a trip between two TTC stop names, stop codes, or lat,lon coordinates.",
    inputSchema: { from: z.string().min(1), to: z.string().min(1), locale: localeSchema },
  }, async ({ from, to, locale }) => {
    const stops = await stopsForSearch(locale);
    const resolve = (place: string) => {
      const coordinates = place.split(",").map(Number);
      if (coordinates.length === 2 && coordinates.every(Number.isFinite)) return { point: coordinates as [number, number] };
      const matches = searchStops(stops, place);
      if (matches.length === 0) return { matches: [] };
      return { point: [matches[0].lat, matches[0].lon] as [number, number], stop: matches[0], alternatives: matches.slice(1, 5).map(({ id, code, name, lat, lon, vehicleMode }) => ({ id, code, name, lat, lon, vehicleMode })) };
    };
    const origin = resolve(from);
    const destination = resolve(to);
    if (!origin.point || !destination.point) return result({ needsSelection: true, from: origin, to: destination });
    const plan: BusPlan = await ttc.trips.plan(origin.point, destination.point, locale);
    return result({ from: origin.stop ?? { lat: origin.point[0], lon: origin.point[1] }, to: destination.stop ?? { lat: destination.point[0], lon: destination.point[1] }, plan });
  });

  return server;
}

export async function connectTtcMcp(ttc: TtcApi) {
  const server = await buildMcpServer(ttc);
  const client = new Client({ name: "ttc-transit-chatbot", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, close: async () => { await client.close(); await server.close(); } };
}
