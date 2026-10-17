import assert from "node:assert/strict";
import { TtcApi } from "../api/src/index.js";

const apiKey = process.env.TTC_API_KEY;
assert.ok(apiKey, "TTC_API_KEY is required in ../.env for the live API test");

const ttc = new TtcApi({ apiKey });
const stops = await ttc.stops.list();

assert.ok(Array.isArray(stops), "the TTC stops response should be an array");
assert.ok(stops.length > 0, "the TTC API should return at least one stop");
assert.ok(stops[0]?.id, "returned stops should include an id");

console.log(`live TTC API request returned ${stops.length} stops`);
