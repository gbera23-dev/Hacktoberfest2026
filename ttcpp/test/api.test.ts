// Checks the URLs, params and header we send, against a local mock server. Says nothing about the real API.
import assert from "node:assert/strict";
import http from "node:http";
import { TtcApi } from "../shared/api/src/index.js";

const seen: { path: string; query: URLSearchParams; key?: string }[] = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url ?? "/", "http://x");
  seen.push({ path: u.pathname, query: u.searchParams, key: req.headers["x-api-key"] as string | undefined });
  res.setHeader("content-type", "application/json");
  res.end(u.pathname.endsWith("/plan") ? JSON.stringify({ from: {}, to: {}, itineraries: [] }) : "[]");
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const port = (server.address() as { port: number }).port;

const ttc = new TtcApi({ apiKey: "k123", baseUrl: `http://127.0.0.1:${port}`, locale: "en" });
const last = () => seen[seen.length - 1];

await ttc.stops.list();
assert.equal(last().path, "/stops"); assert.equal(last().query.get("locale"), "en"); assert.equal(last().key, "k123");

await ttc.stops.arrivals("1946");
assert.equal(last().path, "/stops/1:1946/arrival-times");
assert.equal(last().query.get("locale"), "en");              // default locale survives per-request params
assert.equal(last().query.get("ignoreScheduledArrivalTimes"), "false");

await ttc.stops.arrivals("1:1946", { locale: "ka", ignoreScheduled: true });
assert.equal(last().path, "/stops/1:1946/arrival-times");   // no double prefix
assert.equal(last().query.get("locale"), "ka");
assert.equal(last().query.get("ignoreScheduledArrivalTimes"), "true");

ttc.setLocale("ka");
await ttc.stops.routes(7);
assert.equal(last().path, "/stops/1:7/routes"); assert.equal(last().query.get("locale"), "ka");

await ttc.stops.get(7);
assert.equal(last().path, "/stops/1:7");

await ttc.routes.list();
assert.equal(last().path, "/routes"); assert.equal(last().query.get("modes"), "BUS");

await ttc.routes.stops("306", true);
assert.equal(last().path, "/routes/1:306/stops"); assert.equal(last().query.get("forward"), "true");

await ttc.routes.positions("306");
assert.equal(last().path, "/routes/1:306/positions"); assert.equal(last().query.get("forward"), "true");

await ttc.routes.polyline("306", false);
assert.equal(last().path, "/routes/1:306/polyline"); assert.equal(last().query.get("forward"), "false");

await ttc.trips.plan([41.7151, 44.8271], [41.7099, 44.7929]);
assert.equal(last().path, "/plan");
assert.equal(last().query.get("fromPlace"), "41.7151,44.8271");
assert.equal(last().query.get("toPlace"), "41.7099,44.7929");
assert.equal(last().query.get("modes"), "WALK,BUS");
assert.equal(last().query.get("departMode"), "leaveNow");

// no key -> no header (for the proxy setup)
const proxied = new TtcApi({ baseUrl: `http://127.0.0.1:${port}` });
await proxied.stops.list();
assert.equal(last().key, undefined);

console.log(`all ${seen.length} requests had the expected URL, params and header`);
server.close();
