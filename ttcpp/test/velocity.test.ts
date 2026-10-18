import assert from "node:assert/strict";
import { estimateAverageVelocity } from "../app/src/shared/utils/velocity.js";

const stop = { id: "1:1", code: "1", name: "Test stop", lat: 41.7000, lon: 44.8000, vehicleMode: "BUS" as const };
const velocity = estimateAverageVelocity([{ lat: 41.7100, lon: 44.8000, heading: 0 }], stop, 60);
assert.ok(velocity !== undefined && velocity > 0);
assert.equal(estimateAverageVelocity([], stop, 5), undefined);
assert.equal(estimateAverageVelocity([{ lat: 41.7100, lon: 44.8000, heading: 0 }], stop, 0), undefined);
console.log("velocity estimator tests passed");
