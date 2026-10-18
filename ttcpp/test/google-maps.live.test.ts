import assert from "node:assert/strict";
import { GoogleMapsApi } from "../shared/api/src/index.js";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
assert.ok(apiKey, "GOOGLE_MAPS_API_KEY is required in ../.env");
const google = new GoogleMapsApi({ apiKey });
const result = await google.geocoding.geocode("Tbilisi, Georgia", { language: "en", region: "ge" });
console.log(`live Google Maps geocoding returned ${result.results.length} result(s)`);
