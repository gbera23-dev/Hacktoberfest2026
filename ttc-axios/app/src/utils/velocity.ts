import type { BusLocation, BusStop } from "../../../api/src/index";

const EARTH_RADIUS_KM = 6371;

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const latitude = (b.lat - a.lat) * Math.PI / 180;
  const longitude = (b.lon - a.lon) * Math.PI / 180;
  const first = a.lat * Math.PI / 180;
  const second = b.lat * Math.PI / 180;
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(first) * Math.cos(second) * Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(value));
}

export function estimateAverageVelocity(positions: BusLocation[], stop: BusStop, etaMinutes: number) {
  if (!positions.length || etaMinutes <= 0) return undefined;
  const nearest = positions.reduce((best, position) => distanceKm(position, stop) < distanceKm(best, stop) ? position : best);
  const distance = distanceKm(nearest, stop);
  return Math.round((distance / (etaMinutes / 60)) * 10) / 10;
}
