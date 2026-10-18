import type { ReactNode } from "react";
import { ErrorMessage } from "../../../shared/components/ErrorMessage";
import type { Labels } from "../../../shared/constants/translations";
import type { usePlanner } from "../hooks/usePlanner";

type PlannerState = ReturnType<typeof usePlanner>;
type Props = Pick<PlannerState, "from" | "to" | "pick" | "setPick" | "placeQuery" | "setPlaceQuery" | "places" | "plan" | "applyPlace" | "clear"> & { labels: Labels; children: ReactNode };

export function PlannerControls({ labels, from, to, pick, setPick, placeQuery, setPlaceQuery, places, plan, applyPlace, clear, children }: Props) {
  return <div className="planner-controls">
    <h2>{labels.plan}</h2>
    <p className="muted">{labels.clickMap}</p>
    <div className="coordinate-row">
      <button className={pick === "from" ? "active" : ""} onClick={() => setPick("from")}>{labels.setFrom}<small>{from ? `${from[0].toFixed(5)}, ${from[1].toFixed(5)}` : "—"}</small></button>
      <button className={pick === "to" ? "active" : ""} onClick={() => setPick("to")}>{labels.setTo}<small>{to ? `${to[0].toFixed(5)}, ${to[1].toFixed(5)}` : "—"}</small></button>
    </div>
    <label className="place-search"><span className="sr-only">{labels.searchPlaces}</span><input value={placeQuery} onChange={(event) => setPlaceQuery(event.target.value)} placeholder={labels.searchPlaces} /></label>
    {places.isLoading && <p className="muted">{labels.loading}</p>}
    {places.error && <ErrorMessage error={places.error} />}
    {places.data?.places.map((place) => <button className="place-result" type="button" key={place.id ?? place.name} onClick={() => applyPlace(place)} disabled={!place.location}><strong>{place.displayName?.text ?? place.name ?? "Place"}</strong><small>{place.formattedAddress ?? labels.usePlace}</small></button>)}
    <button className="text-button" onClick={clear}>{labels.clear}</button>
    <div className="itineraries">
      {plan.isLoading && <p className="muted">{labels.loading}</p>}
      {plan.error && <ErrorMessage error={plan.error} />}
      {plan.data?.itineraries.map((itinerary, index) => <article className="itinerary" key={index}><strong>{Math.round(itinerary.duration / 60)} {labels.minutes}</strong><span>{itinerary.legs.map((leg) => leg.mode).join(" → ")}</span><small>{itinerary.legs.map((leg) => leg.route?.shortName).filter(Boolean).join(" · ") || "Walk"}</small></article>)}
    </div>
    {children}
  </div>;
}
