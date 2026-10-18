import { useEffect, useRef, useState } from "react";
import type { BusStop, Locale } from "../../../../../shared/api/src/index";
import { TtcMap } from "../../../shared/components/TtcMap";
import { ErrorMessage } from "../../../shared/components/ErrorMessage";
import { estimateCrowding } from "../../../shared/utils/crowding";
import { useStopPanelData } from "../hooks/useStopPanelData";
import type { Labels } from "../../../shared/constants/translations";
import { StopAlerts } from "./StopAlerts";

const STOP_LIST_LIMIT = 80;

export function StopPanel({ locale, labels, stops, selectedStop, onSelect }: { locale: Locale; labels: Labels; stops: BusStop[]; selectedStop?: BusStop; onSelect: (stop: BusStop) => void }) {
  const [search, setSearch] = useState("");
  const { arrivals, stopRoutes, arrivalRoutes, routePositions, filtered, velocityFor } = useStopPanelData(locale, stops, selectedStop, search);

  return <section className="split-panel">
    <div className="panel-list">
      <label className="search"><span className="sr-only">{labels.search}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={labels.search} /></label>
      <div className="list-scroll">{filtered.map((stop) => <button className={`list-item ${selectedStop?.id === stop.id ? "selected" : ""}`} key={stop.id} onClick={() => onSelect(stop)}><strong>{stop.name}</strong><small>{stop.code ?? stop.id}</small></button>)}{filtered.length === 0 && <p className="muted">{labels.noData}</p>}</div>
    </div>
    <div className="panel-detail">
      {!selectedStop && <p className="empty">{labels.choose}</p>}
      {selectedStop && <>
        <div className="detail-heading"><div><span className="eyebrow">{selectedStop.code ?? selectedStop.id}</span><h2>{selectedStop.name}</h2></div><span className="mode-pill">{selectedStop.vehicleMode}</span></div>
        <h3>{labels.departures}</h3>
        {selectedStop.vehicleMode === "BUS" && <p className="muted crowding-note">{labels.crowdingNote}</p>}
        {arrivals.isLoading && <p className="muted">{labels.loading}</p>}
        {arrivals.error && <ErrorMessage error={arrivals.error} />}
        {selectedStop.vehicleMode === "BUS" && <StopAlerts labels={labels} stop={selectedStop} arrivals={arrivals.data} routes={arrivalRoutes} positions={routePositions} />}
        <div className="arrivals">{arrivals.data?.map((arrival, index) => { const velocity = velocityFor(arrival.shortName, arrival.realtimeArrivalMinutes); const crowding = selectedStop.vehicleMode === "BUS" ? estimateCrowding(arrival, arrivals.data ?? [], selectedStop) : undefined; const crowdingLabel = crowding?.level === "LOW" ? labels.crowdingLow : crowding?.level === "MODERATE" ? labels.crowdingModerate : crowding?.level === "BUSY" ? labels.crowdingBusy : labels.crowdingVeryBusy; return <div className="arrival" key={`${arrival.shortName}-${index}`}><span className="arrival-route" aria-label={`Bus ${arrival.shortName}, ${arrival.realtimeArrivalMinutes} ${labels.minutes}`}><span className="route-badge" style={{ background: arrival.color || "#0f766e" }}>{arrival.shortName}</span><strong>Bus {arrival.shortName} · {arrival.realtimeArrivalMinutes} {labels.minutes}</strong></span><span>{arrival.headsign}</span><small>{arrival.realtime ? <><span className="realtime-signal" aria-label={labels.realtime}><i /><i /><i /></span>{labels.realtime}</> : labels.scheduled}{velocity !== undefined && <span className="velocity"> · {velocity} {labels.avgVelocity}</span>}{crowding && <><span className={`crowding-badge crowding-${crowding.level.toLowerCase()}`} title={`${labels.crowdingEstimate}: ${crowdingLabel}`}>{crowdingLabel}</span><span className="crowding-confidence"> · {crowding.confidence === "MEDIUM" ? labels.confidenceMedium : labels.confidenceLow}</span></>}</small></div>; })}</div>
        <h3>{labels.routes}</h3>
        {stopRoutes.data?.map((route) => <span className="route-chip" key={route.id}>{route.shortName} · {route.longName}</span>)}
      </>}
    </div>
  </section>;
}

