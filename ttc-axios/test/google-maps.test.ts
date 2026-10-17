import assert from "node:assert/strict";
import http from "node:http";
import { GoogleMapsApi, summarizeGoogleTransitRoutes } from "../api/src/index.js";

const seen: { path: string; apiKey?: string; fieldMask?: string }[] = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  seen.push({ path: url.pathname, apiKey: req.headers["x-goog-api-key"] as string | undefined, fieldMask: req.headers["x-goog-fieldmask"] as string | undefined });
  res.setHeader("content-type", "application/json");
  if (url.pathname.includes("computeRoutes")) res.end(JSON.stringify({ routes: [{ distanceMeters: 1000, duration: "600s" }] }));
  else res.end(JSON.stringify({ results: [] }));
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = (server.address() as { port: number }).port;

const google = new GoogleMapsApi({ apiKey: "secret", routesBaseUrl: `http://127.0.0.1:${port}`, geocodingBaseUrl: `http://127.0.0.1:${port}` });
const route = await google.routes.compute({ origin: { address: "Didube" }, destination: { address: "Free University" } });
assert.equal(route.routes?.[0]?.duration, "600s");
const geocode = await google.geocoding.geocode("Tbilisi");
assert.ok(Array.isArray(geocode.results));
assert.equal(seen[0]?.apiKey, "secret");
assert.ok(seen[0]?.fieldMask?.includes("routes.duration"));
const transit = summarizeGoogleTransitRoutes({ routes: [{ legs: [{ steps: [{ distanceMeters: 1200, duration: "300s", transitDetails: { transitLine: { name: "Didube route", nameShort: "338", vehicle: { name: { text: "Bus" }, type: "BUS" } }, headsign: "Free University", stopCount: 4, stopDetails: { departureStop: { name: "Didube" }, arrivalStop: { name: "Agrarian University" } } } }] }] }] });
assert.deepEqual(transit[0]?.transitSteps[0], { distanceMeters: 1200, duration: "300s", lineName: "Didube route", lineShortName: "338", lineColor: undefined, lineTextColor: undefined, vehicleName: "Bus", vehicleType: "BUS", vehicleIconUri: undefined, headsign: "Free University", stopCount: 4, departureStop: "Didube", arrivalStop: "Agrarian University" });

const fallback = new GoogleMapsApi({ apiKey: "expired", routesBaseUrl: "http://127.0.0.1:1", geocodingBaseUrl: "http://127.0.0.1:1", useMockFallback: true });
const fallbackRoute = await fallback.routes.compute({ origin: { address: "Didube" }, destination: { address: "Free University" } });
assert.equal(fallbackRoute.fallbackInfo?.reason, "MOCK_DATA");
const fallbackGeocode = await fallback.geocoding.geocode("Didube Metro Station");
assert.equal(fallbackGeocode.results[0]?.placeId, "mock-didube-metro");

server.close();
console.log(`google maps wrapper tests passed (${seen.length} requests)`);
