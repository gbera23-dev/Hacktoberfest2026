export type Locale = "ka" | "en";

export interface BusStop {
  id: string;
  code: string | null;
  name: string;
  lat: number;
  lon: number;
  vehicleMode: "BUS" | "GONDOLA" | "SUBWAY";
}

/** A route. Note: the API calls its id "busId". */
export interface Bus {
  id: string;
  shortName: string;
  longName: string;
  color: string;
  mode: string;
}

export interface BusArrival {
  shortName: string;
  color: string;
  headsign: string;
  realtime: boolean;
  realtimeArrivalMinutes: number;
  scheduledArrivalMinutes: number;
}

/** No vehicle id in this response, so individual buses can't be followed. */
export interface BusLocation {
  lat: number;
  lon: number;
  heading: number;
  nextStopId?: string;
}

export interface Polyline {
  encodedValue: string;
}

export interface Place { lat: number; lon: number; name: string }

export interface Leg {
  from: Place;
  to: Place;
  startTime: number | string; // wrapper says Date; JSON can't carry one. Check the first live response.
  endTime: number | string;
  duration: number;
  legPolyline: { encodedValue: string; color: string | null };
  mode: "BUS" | "WALK";
  steps: { relativeDirection: string; distance: number; streetName: string; lat: number; lon: number }[];
  intermediateStops: { id: string; code: string; name: string; lat: number; lon: number; vehicleMode: string }[] | null;
  route: Bus | null;
  realTime: boolean;
  arrivalDelay: number;
  distance: number;
}

export interface Itinerary {
  startTime: number | string;
  endTime: number | string;
  duration: number;
  walkTime: number;
  walkDistance: number;
  legs: Leg[];
}

export interface BusPlan {
  from: Place;
  to: Place;
  itineraries: Itinerary[];
}

export type LatLng = [lat: number, lon: number];
