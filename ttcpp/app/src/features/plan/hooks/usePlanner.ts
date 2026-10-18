import { useState } from "react";
import type { GooglePlace, LatLng, Locale } from "../../../../../shared/api/src/index";
import { useGooglePlaces, useGoogleRouteComparison, useTripPlan, useWhatIfSimulator } from "../../../shared/hooks/useTtcQueries";

export function usePlanner(locale: Locale) {
  const [from, setFrom] = useState<LatLng>();
  const [to, setTo] = useState<LatLng>();
  const [pick, setPick] = useState<"from" | "to">("from");
  const [placeQuery, setPlaceQuery] = useState("");
  const plan = useTripPlan(from, to, locale);
  const googleRoutes = useGoogleRouteComparison(from, to, locale);
  const whatIf = useWhatIfSimulator();
  const places = useGooglePlaces(placeQuery, locale, from ?? to);
  const pickPoint = (point: LatLng) => pick === "from" ? setFrom(point) : setTo(point);
  const applyPlace = (place: GooglePlace) => { if (place.location) pickPoint([place.location.latitude, place.location.longitude]); };
  const clear = () => { setFrom(undefined); setTo(undefined); setPlaceQuery(""); };
  const durationMinutes = (duration?: string) => duration ? Math.max(1, Math.round(Number.parseFloat(duration) / 60)) : undefined;
  return { from, to, pick, setPick, placeQuery, setPlaceQuery, plan, googleRoutes, whatIf, places, pickPoint, applyPlace, clear, durationMinutes };
}
