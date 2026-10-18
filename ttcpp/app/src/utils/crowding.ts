import type { BusArrival, BusStop } from "../../../api/src/index";

export type CrowdingLevel = "LOW" | "MODERATE" | "BUSY" | "VERY_BUSY";
export type CrowdingConfidence = "LOW" | "MEDIUM";

export interface CrowdingEstimate {
  level: CrowdingLevel;
  score: number;
  confidence: CrowdingConfidence;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Estimates likely crowding from TTC arrival data. TTC does not expose
 * passenger counts, so this deliberately returns a category, not a fake
 * occupancy percentage.
 */
export function estimateCrowding(
  arrival: BusArrival,
  arrivals: BusArrival[],
  stop: BusStop,
  now = new Date(),
): CrowdingEstimate {
  const hour = now.getHours();
  const weekday = now.getDay() > 0 && now.getDay() < 6;
  let score = 25;

  if (weekday && ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 20))) score += 22;
  else if (weekday && hour >= 10 && hour < 16) score += 7;
  else if (hour >= 22 || hour < 6) score -= 16;
  else score += 3;

  // Interchanges and major destinations usually accumulate more demand.
  if (stop.vehicleMode === "SUBWAY") score += 12;
  if (/(metro|m\/s|station|square|university|stadium|airport|mall|terminal|მეტრო|სადგური|უნივერსიტეტი)/i.test(stop.name)) score += 10;

  const sameRoute = arrivals
    .filter((candidate) => candidate.shortName === arrival.shortName && candidate.realtimeArrivalMinutes >= arrival.realtimeArrivalMinutes)
    .map((candidate) => candidate.realtimeArrivalMinutes)
    .sort((a, b) => a - b);
  const nextArrival = sameRoute.find((minutes) => minutes > arrival.realtimeArrivalMinutes);
  const headway = nextArrival === undefined ? undefined : nextArrival - arrival.realtimeArrivalMinutes;

  // A long gap lets a queue build; a very short wait is a small demand signal.
  if (headway !== undefined && headway >= 15) score += Math.min(20, Math.round((headway - 10) * 1.5));
  if (arrival.realtimeArrivalMinutes > 10) score += Math.min(10, Math.floor(arrival.realtimeArrivalMinutes / 4));
  if (arrival.realtimeArrivalMinutes <= 3) score += 4;

  const bounded = clamp(score);
  const level: CrowdingLevel = bounded >= 75 ? "VERY_BUSY" : bounded >= 55 ? "BUSY" : bounded >= 35 ? "MODERATE" : "LOW";
  return { level, score: bounded, confidence: arrival.realtime ? "MEDIUM" : "LOW" };
}
