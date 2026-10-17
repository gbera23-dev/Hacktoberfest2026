import assert from "node:assert/strict";
import { connectTtcMcp } from "../api/src/mcp.js";
import type { GoogleMapsApi } from "../api/src/GoogleMapsApi.js";
import type { BusPlan, BusStop } from "../api/src/types.js";
import type { TtcApi } from "../api/src/TtcApi.js";

const didubeMetro: BusStop = { id: "1:metro_1_5", code: null, name: "M/S Didube", vehicleMode: "SUBWAY", lat: 41.749767, lon: 44.779989 };
const stationSquare: BusStop = { id: "1:metro_1_8", code: null, name: "M/S Station Square 1", vehicleMode: "SUBWAY", lat: 41.722098, lon: 44.797739 };
const technicalUniversity: BusStop = { id: "1:1008", code: "1008", name: "Technical University 3rd Building", vehicleMode: "BUS", lat: 41.721262, lon: 44.777564 };
const cityCourt: BusStop = { id: "1:1205", code: "1205", name: "Tbilisi City Court", vehicleMode: "BUS", lat: 41.772252, lon: 44.768372 };
const freedomStreet: BusStop = { id: "1:2632", code: "2632", name: "Freedom St #70", vehicleMode: "BUS", lat: 41.823877, lon: 44.752051 };
const ttc = {
  stops: { list: async () => [didubeMetro, stationSquare, technicalUniversity, cityCourt, freedomStreet] },
  routes: { list: async () => [] },
  trips: { plan: async (from: [number, number], to: [number, number]): Promise<BusPlan> => ({ from: { lat: from[0], lon: from[1], name: "Origin" }, to: { lat: to[0], lon: to[1], name: "Destination" }, itineraries: [] }) },
} as unknown as TtcApi;
const google = { geocoding: { geocode: async () => ({ results: [{ place: "places/free-university", placeId: "free-university", formattedAddress: "Free University of Tbilisi", location: { latitude: 41.8057235, longitude: 44.7679149 }, addressComponents: [], types: ["university"] }] }) } } as unknown as GoogleMapsApi;
const textFrom = (response: unknown) => {
  const content = typeof response === "object" && response !== null && "content" in response && Array.isArray(response.content) ? response.content : [];
  const textPart = content.find((part: unknown): part is { type: "text"; text: string } => typeof part === "object" && part !== null && "type" in part && part.type === "text" && "text" in part && typeof part.text === "string");
  return textPart?.text ?? "";
};

const mcp = await connectTtcMcp(ttc, google);
const search = await mcp.client.callTool({ name: "search_stops", arguments: { query: "Didube Metro Station", locale: "en" } });
const searchText = textFrom(search);
assert.equal(JSON.parse(searchText).stops[0].id, didubeMetro.id);

const plan = await mcp.client.callTool({ name: "plan_trip", arguments: { from: "Didube Metro Station", to: "Free University of Tbilisi", locale: "en" } });
const planText = textFrom(plan);
const planData = JSON.parse(planText);
assert.equal(planData.from.id, didubeMetro.id);
assert.equal(planData.to.placeId, "free-university");
assert.deepEqual(planData.to, { placeId: "free-university", address: "Free University of Tbilisi", lat: 41.8057235, lon: 44.7679149, types: ["university"] });
await mcp.close();
console.log("MCP place resolution tests passed");
