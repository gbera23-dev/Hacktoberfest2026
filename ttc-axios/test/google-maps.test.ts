import assert from "node:assert/strict";
import http from "node:http";
import { GoogleMapsApi, summarizeGoogleTransitRoutes } from "../api/src/index.js";

const seen: { path: string; apiKey?: string; fieldMask?: string }[] = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  seen.push({ path: url.pathname, apiKey: req.headers["x-goog-api-key"] as string | undefined, fieldMask: req.headers["x-goog-fieldmask"] as string | undefined });
  res.setHeader("content-type", "application/json");
  if (url.pathname.includes("computeRoutes")) res.end(JSON.stringify({ routes: [{ distanceMeters: 1000, duration: "600s" }] }));
  else if (url.pathname.includes("searchText")) res.end(JSON.stringify({ places: [{ id: "place-1", displayName: { text: "Free University" }, formattedAddress: "Tbilisi", location: { latitude: 41.8, longitude: 44.7 }, types: ["university"] }] }));
  else res.end(JSON.stringify({ results: [] }));
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = (server.address() as { port: number }).port;

const google = new GoogleMapsApi({ apiKey: "secret", routesBaseUrl: `http://127.0.0.1:${port}`, geocodingBaseUrl: `http://127.0.0.1:${port}`, placesBaseUrl: `http://127.0.0.1:${port}` });
const route = await google.routes.compute({ origin: { address: "Didube" }, destination: { address: "Free University" } });
assert.equal(route.routes?.[0]?.duration, "600s");
const geocode = await google.geocoding.geocode("Tbilisi");
assert.ok(Array.isArray(geocode.results));
const places = await google.places.search({ textQuery: "Free University", languageCode: "en", regionCode: "ge" });
assert.equal(places.places?.[0]?.displayName?.text, "Free University");
assert.equal(seen[0]?.apiKey, "secret");
assert.ok(seen[0]?.fieldMask?.includes("routes.duration"));
const transit = summarizeGoogleTransitRoutes({ routes: [{ legs: [{ steps: [{ distanceMeters: 1200, duration: "300s", transitDetails: { transitLine: { name: "Didube route", nameShort: "338", vehicle: { name: { text: "Bus" }, type: "BUS" } }, headsign: "Free University", stopCount: 4, stopDetails: { departureStop: { name: "Didube" }, arrivalStop: { name: "Agrarian University" } } } }] }] }] });
assert.deepEqual(transit[0]?.transitSteps[0], { distanceMeters: 1200, duration: "300s", lineName: "Didube route", lineShortName: "338", lineColor: undefined, lineTextColor: undefined, vehicleName: "Bus", vehicleType: "BUS", vehicleIconUri: undefined, headsign: "Free University", stopCount: 4, departureStop: "Didube", arrivalStop: "Agrarian University" });

const fallback = new GoogleMapsApi({ apiKey: "expired", routesBaseUrl: "http://127.0.0.1:1", geocodingBaseUrl: "http://127.0.0.1:1", placesBaseUrl: "http://127.0.0.1:1", useMockFallback: true });
const fallbackRoute = await fallback.routes.compute({ origin: { address: "Didube" }, destination: { address: "Free University" } });
assert.equal(fallbackRoute.fallbackInfo?.reason, "MOCK_DATA");
const fallbackGeocode = await fallback.geocoding.geocode("Didube Metro Station");
assert.equal(fallbackGeocode.results[0]?.placeId, "mock-didube-metro");
const fallbackPlaces = await fallback.places.search({ textQuery: "Tbilisi Mall" });
assert.equal(fallbackPlaces.places?.[0]?.id, "mock-tbilisi-mall");

const rateLimitedServer = http.createServer((_req, res) => {
  res.statusCode = 429;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: { status: "RESOURCE_EXHAUSTED" } }));
});
await new Promise<void>((resolve) => rateLimitedServer.listen(0, "127.0.0.1", resolve));
const rateLimitedPort = (rateLimitedServer.address() as { port: number }).port;
const rateLimited = new GoogleMapsApi({ apiKey: "quota-exhausted", routesBaseUrl: `http://127.0.0.1:${rateLimitedPort}` });
const rateLimitedRoute = await rateLimited.routes.compute({ origin: { address: "Didube" }, destination: { address: "Free University" } });
assert.equal(rateLimitedRoute.fallbackInfo?.reason, "MOCK_DATA");
rateLimitedServer.close();

server.close();
console.log(`google maps wrapper tests passed (${seen.length} requests)`);
