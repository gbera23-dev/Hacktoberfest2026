import assert from "node:assert/strict";
import test from "node:test";
import type { BusArrival, BusStop } from "../shared/api/src/index";
import { estimateCrowding } from "../app/src/shared/utils/crowding";

const stop: BusStop = { id: "1", code: "1001", name: "Didube Metro Station", lat: 41.75, lon: 44.78, vehicleMode: "BUS" };
const arrival = (minutes: number, realtime = true): BusArrival => ({ shortName: "338", color: "#087f5b", headsign: "Free University", realtime, realtimeArrivalMinutes: minutes, scheduledArrivalMinutes: minutes });

test("crowding rises during weekday rush hour and a long route headway", () => {
  const estimate = estimateCrowding(arrival(12), [arrival(12), arrival(32)], stop, new Date("2026-10-19T08:00:00+04:00"));
  assert.ok(estimate.score >= 55);
  assert.notEqual(estimate.level, "LOW");
  assert.equal(estimate.confidence, "MEDIUM");
});

test("off-peak scheduled arrivals at a normal stop get a lower-confidence estimate", () => {
  const estimate = estimateCrowding({ ...arrival(2, false), headsign: "Suburban terminal" }, [{ ...arrival(2, false) }], { ...stop, name: "Residential Street" }, new Date("2026-10-19T13:00:00+04:00"));
  assert.equal(estimate.level, "MODERATE");
  assert.equal(estimate.confidence, "LOW");
});

test("long headways score higher than frequent arrivals under the same conditions", () => {
  const frequent = estimateCrowding(arrival(5), [arrival(5), arrival(15)], stop, new Date("2026-10-18T13:00:00+04:00"));
  const sparse = estimateCrowding(arrival(5), [arrival(5), arrival(35)], stop, new Date("2026-10-18T13:00:00+04:00"));
  assert.ok(sparse.score > frequent.score);
});
