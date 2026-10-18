import type { LatLng, Locale } from "../../../../../shared/api/src/index";
import { ErrorMessage } from "../../../shared/components/ErrorMessage";
import type { Labels } from "../../../shared/constants/translations";
import type { usePlanner } from "../hooks/usePlanner";
import { WHAT_IF_DEPARTURE_OFFSETS_MINUTES } from "../../../shared/constants/application";

type PlannerState = ReturnType<typeof usePlanner>;
type Props = Pick<PlannerState, "googleRoutes" | "whatIf" | "durationMinutes"> & { labels: Labels; locale: Locale; from?: LatLng; to?: LatLng };

export function PlanInsights({ labels, locale, from, to, googleRoutes, whatIf, durationMinutes }: Props) {
  const walking = googleRoutes.data?.walking;
  const fastestBus = googleRoutes.data?.transit[0];
  return <>
    <section className="route-comparison">
      <h3>{labels.walkingTime} vs {labels.busTime}</h3>
      {googleRoutes.isLoading && <p className="muted">{labels.loading}</p>}
      {googleRoutes.error && <ErrorMessage error={googleRoutes.error} />}
      {googleRoutes.data && <div className="comparison-grid">
        <article><strong>{labels.walkingTime}</strong><b>{durationMinutes(walking?.duration) ?? "—"} {labels.minutes}</b>{walking?.distanceMeters && <small>{labels.distance}: {(walking.distanceMeters / 1000).toFixed(1)} km</small>}</article>
        <article><strong>{labels.busTime}</strong><b>{durationMinutes(fastestBus?.duration) ?? "—"} {labels.minutes}</b>{fastestBus?.transitSteps.length ? <small>{labels.busRoute}: {fastestBus.transitSteps.map((step) => step.lineShortName || step.lineName).filter(Boolean).join(" · ")}</small> : <small>{labels.noBusRoute}</small>}</article>
      </div>}
    </section>
    <section className="what-if">
      <h3>{labels.whatIf}</h3>
      <p className="muted">{labels.simulationNote}</p>
      <button className="text-button" disabled={!from || !to || whatIf.isPending} onClick={() => from && to && whatIf.mutate({ from, to, locale, offsetsMinutes: [...WHAT_IF_DEPARTURE_OFFSETS_MINUTES] })}>{whatIf.isPending ? labels.loading : labels.compareDepartures}</button>
      {whatIf.error && <ErrorMessage error={whatIf.error} />}
      {whatIf.data && <pre className="what-if-result">{whatIf.data.message}</pre>}
    </section>
    {googleRoutes.data?.transit.map((route, index) => <article className="google-transit-route" key={index}>
      <strong>{labels.googleTransit} {index + 1}</strong>
      <small>{route.duration ? `${durationMinutes(route.duration)} ${labels.minutes}` : ""}</small>
      {route.transitSteps.length === 0 ? <p className="muted">{labels.noTransit}</p> : route.transitSteps.map((step, stepIndex) => <div className="google-transit-step" key={stepIndex}>
        <span className="route-badge" style={{ background: step.lineColor || "#0f766e", color: step.lineTextColor || "#fff" }}>{step.lineShortName || step.lineName || "Transit"}</span>
        <span>{step.vehicleName || step.vehicleType || "Transit vehicle"}{step.headsign ? ` · ${step.headsign}` : ""}</span>
        <small>{step.departureStop || "Origin"} → {step.arrivalStop || "Destination"}{step.stopCount !== undefined ? ` · ${step.stopCount} stops` : ""}</small>
      </div>)}
    </article>)}
  </>;
}
