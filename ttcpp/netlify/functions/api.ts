import { GoogleMapsApi, TtcApi, summarizeGoogleRoutes, summarizeGoogleTransitRoutes, type LatLng, type Locale } from "../../shared/api/src/index.js";
import { runTtcChat, type ChatContext, type ChatTurn } from "../../shared/api/src/chatGraph.js";
import { runWhatIfSimulator, type WhatIfInput } from "../../shared/api/src/whatIfGraph.js";

type Event = {
  httpMethod: string;
  path: string;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  headers?: Record<string, string | undefined>;
};

type Response = { statusCode: number; headers: Record<string, string>; body: string };

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" };
const json = (value: unknown, statusCode = 200): Response => ({ statusCode, headers: jsonHeaders, body: JSON.stringify(value) });
const errorResponse = (error: unknown, statusCode = 502) => json({ message: error instanceof Error ? error.message : "TTC request failed" }, statusCode);
const id = (value: string) => value.replace(/^1:/, "");
const getLocale = (value: unknown): Locale | undefined => value === "ka" || value === "en" ? value : undefined;

const apiKey = process.env.TTC_API_KEY;
if (!apiKey) throw new Error("TTC_API_KEY is required");
const ttc = new TtcApi({ apiKey });
const googleMaps = process.env.GOOGLE_MAPS_API_KEY ? new GoogleMapsApi({ apiKey: process.env.GOOGLE_MAPS_API_KEY, useMockFallback: process.env.GOOGLE_MAPS_USE_MOCK === "true" }) : undefined;

function bodyOf(event: Event): Record<string, unknown> {
  if (!event.body) return {};
  try { return JSON.parse(event.body) as Record<string, unknown>; } catch { return {}; }
}

function point(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function query(event: Event, key: string) { return event.queryStringParameters?.[key]; }

export async function handler(event: Event): Promise<Response> {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: jsonHeaders, body: "" };
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";
  const locale = getLocale(query(event, "locale"));
  try {
    if (event.httpMethod === "GET" && path === "/health") return json({ ok: true });
    if (event.httpMethod === "GET" && path === "/ttc/stops") return json(await ttc.stops.list(locale));
    const stopMatch = path.match(/^\/ttc\/stops\/([^/]+)$/);
    if (event.httpMethod === "GET" && stopMatch) return json(await ttc.stops.get(id(stopMatch[1]), locale));
    const stopRoutesMatch = path.match(/^\/ttc\/stops\/([^/]+)\/routes$/);
    if (event.httpMethod === "GET" && stopRoutesMatch) return json(await ttc.stops.routes(id(stopRoutesMatch[1]), locale));
    const arrivalsMatch = path.match(/^\/ttc\/stops\/([^/]+)\/arrival-times$/);
    if (event.httpMethod === "GET" && arrivalsMatch) return json(await ttc.stops.arrivals(id(arrivalsMatch[1]), { locale, ignoreScheduled: query(event, "ignoreScheduled") === "true" }));
    if (event.httpMethod === "GET" && path === "/ttc/routes") return json(await ttc.routes.list(locale));
    const routeStopsMatch = path.match(/^\/ttc\/routes\/([^/]+)\/stops$/);
    if (event.httpMethod === "GET" && routeStopsMatch) return json(await ttc.routes.stops(id(routeStopsMatch[1]), query(event, "forward") !== "false", locale));
    const polylineMatch = path.match(/^\/ttc\/routes\/([^/]+)\/polyline$/);
    if (event.httpMethod === "GET" && polylineMatch) return json(await ttc.routes.polyline(id(polylineMatch[1]), query(event, "forward") !== "false"));
    const positionsMatch = path.match(/^\/ttc\/routes\/([^/]+)\/positions$/);
    if (event.httpMethod === "GET" && positionsMatch) return json(await ttc.routes.positions(id(positionsMatch[1]), query(event, "forward") !== "false"));
    if (event.httpMethod === "GET" && path === "/ttc/plan") {
      const from = String(query(event, "fromPlace") ?? "").split(",").map(Number) as LatLng;
      const to = String(query(event, "toPlace") ?? "").split(",").map(Number) as LatLng;
      if (from.length !== 2 || to.length !== 2 || [...from, ...to].some(Number.isNaN)) return json({ message: "fromPlace and toPlace must be lat,lon coordinates" }, 400);
      return json(await ttc.trips.plan(from, to, locale));
    }
    if (event.httpMethod === "GET" && path === "/google/transit-route") {
      if (!googleMaps) return json({ message: "Google Maps is not configured" }, 503);
      const parsePoint = (value: unknown): [number, number] | undefined => { const parsed = String(value ?? "").split(",").map(Number); return parsed.length === 2 && parsed.every(Number.isFinite) ? [parsed[0], parsed[1]] : undefined; };
      const from = parsePoint(query(event, "from")); const to = parsePoint(query(event, "to"));
      if (!from || !to) return json({ message: "from and to must be lat,lon coordinates" }, 400);
      const routes = await googleMaps.routes.compute({ origin: { location: { latLng: { latitude: from[0], longitude: from[1] } } }, destination: { location: { latLng: { latitude: to[0], longitude: to[1] } } }, travelMode: "TRANSIT", computeAlternativeRoutes: true, departureTime: new Date(Date.now() + 60_000).toISOString(), languageCode: locale ?? "en", units: "METRIC" });
      return json({ routes: summarizeGoogleTransitRoutes(routes) });
    }
    if (event.httpMethod === "GET" && path === "/google/route-comparison") {
      if (!googleMaps) return json({ message: "Google Maps is not configured" }, 503);
      const parsePoint = (value: unknown): LatLng | undefined => { const parsed = String(value ?? "").split(",").map(Number); return parsed.length === 2 && parsed.every(Number.isFinite) ? [parsed[0], parsed[1]] : undefined; };
      const from = parsePoint(query(event, "from")); const to = parsePoint(query(event, "to"));
      if (!from || !to) return json({ message: "from and to must be lat,lon coordinates" }, 400);
      const origin = { location: { latLng: { latitude: from[0], longitude: from[1] } } };
      const destination = { location: { latLng: { latitude: to[0], longitude: to[1] } } };
      const languageCode = locale ?? "en";
      const [walking, transit] = await Promise.all([
        googleMaps.routes.compute({ origin, destination, travelMode: "WALK", computeAlternativeRoutes: false, languageCode, units: "METRIC" }),
        googleMaps.routes.compute({ origin, destination, travelMode: "TRANSIT", computeAlternativeRoutes: true, departureTime: new Date(Date.now() + 60_000).toISOString(), languageCode, units: "METRIC" }),
      ]);
      return json({ walking: summarizeGoogleRoutes(walking)[0] ?? null, transit: summarizeGoogleTransitRoutes(transit) });
    }
    if (event.httpMethod === "GET" && path === "/google/places/search") {
      if (!googleMaps) return json({ message: "Google Maps is not configured" }, 503);
      const textQuery = String(query(event, "q") ?? "").trim();
      if (textQuery.length < 2) return json({ places: [] });
      const latitude = Number(query(event, "lat")); const longitude = Number(query(event, "lon"));
      const hasCenter = Number.isFinite(latitude) && Number.isFinite(longitude);
      return json(await googleMaps.places.search({ textQuery, languageCode: locale ?? "en", regionCode: "ge", maxResultCount: 5, ...(hasCenter ? { locationBias: { circle: { center: { latitude, longitude }, radius: 5_000 } } } : {}) }));
    }
    if (event.httpMethod === "POST" && path === "/chat") {
      const body = bodyOf(event); const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ message: "A chat message is required" }, 400);
      if (!process.env.GEMINI_API_KEY) return json({ message: "GEMINI_API_KEY is not configured" }, 503);
      const context = body.context as Partial<ChatContext> | undefined;
      const history = Array.isArray(body.history) ? body.history.filter((turn: unknown): turn is ChatTurn => Boolean(turn && typeof turn === "object" && ((turn as ChatTurn).role === "user" || (turn as ChatTurn).role === "assistant") && typeof (turn as ChatTurn).text === "string")) : [];
      const safeContext: ChatContext = { locale: context?.locale === "ka" ? "ka" : "en", screen: context?.screen === "stops" || context?.screen === "routes" || context?.screen === "live" ? context.screen : "plan", selectedStop: context?.selectedStop, selectedRoute: context?.selectedRoute };
      return json(await runTtcChat(ttc, process.env.GEMINI_API_KEY, message, safeContext, history, googleMaps));
    }
    if (event.httpMethod === "POST" && path === "/what-if") {
      if (!process.env.WHAT_IF_API_KEY || process.env.WHAT_IF_API_KEY === "my-key") return json({ message: "WHAT_IF_API_KEY is not configured yet" }, 503);
      const body = bodyOf(event);
      if (!point(body.from) || !point(body.to)) return json({ message: "from and to must be coordinate pairs" }, 400);
      const offsetsMinutes = Array.isArray(body.offsetsMinutes) ? body.offsetsMinutes.filter((offset): offset is number => typeof offset === "number" && Number.isInteger(offset) && offset >= 0 && offset <= 180).slice(0, 6) : [0, 10, 20, 30];
      if (offsetsMinutes.length === 0) return json({ message: "At least one departure offset is required" }, 400);
      const input: WhatIfInput = { from: body.from, to: body.to, locale: body.locale === "ka" ? "ka" : "en", offsetsMinutes };
      return json(await runWhatIfSimulator(ttc, process.env.WHAT_IF_API_KEY, input, googleMaps));
    }
    return json({ message: "Not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
