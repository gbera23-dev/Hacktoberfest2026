import { useEffect, useRef, useState } from "react";
import type { BusArrival, BusLocation, BusStop } from "../../../../../shared/api/src/index";
import type { Labels } from "../../../shared/constants/translations";
import { STOP_ALERT_DEFAULT_THRESHOLD_MINUTES, STOP_ALERT_RECENT_LIMIT, STOP_ALERT_THRESHOLDS_MINUTES, STOP_ALERT_TRAFFIC_SURGE_MINUTES } from "../../../shared/constants/application";

export function StopAlerts({ labels, stop, arrivals, routes, positions }: { labels: Labels; stop: BusStop; arrivals: BusArrival[] | undefined; routes: { id: string; shortName: string }[] | undefined; positions: { data?: BusLocation[] }[] }) {
  const storageKey = `ttc-alerts:${stop.id}`;
  const [enabled, setEnabled] = useState(() => window.localStorage.getItem(storageKey) === "true");
  const [threshold, setThreshold] = useState(STOP_ALERT_DEFAULT_THRESHOLD_MINUTES);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  const [recentAlerts, setRecentAlerts] = useState<string[]>([]);
  const fired = useRef(new Set<string>());
  const previousArrivals = useRef(new Map<string, number>());
  const trafficSurgeAlert = labels.alerts === "გაჩერების შეტყობინებები"
    ? "წინ მოძრაობა გაუარესდა: ავტობუსი {route} ახლა {minutes} წთ-ში მოვა (ადრე {previous} წთ)"
    : "Traffic surge ahead: bus {route} arrival changed from {previous} to {minutes} min";

  useEffect(() => {
    fired.current.clear();
    setEnabled(window.localStorage.getItem(storageKey) === "true");
    setRecentAlerts([]);
  }, [storageKey]);

  const notify = (key: string, title: string, body: string) => {
    if (!enabled || fired.current.has(key)) return;
    fired.current.add(key);
    setRecentAlerts((current) => [body, ...current].slice(0, STOP_ALERT_RECENT_LIMIT));
    if (permission === "granted") new Notification(title, { body, tag: key });
  };

  useEffect(() => {
    if (!enabled) return;
    arrivals?.forEach((arrival) => {
      const minutes = arrival.realtimeArrivalMinutes;
      const previous = previousArrivals.current.get(arrival.shortName);
      if (arrival.realtime && previous !== undefined && minutes - previous >= STOP_ALERT_TRAFFIC_SURGE_MINUTES) {
        const body = trafficSurgeAlert.replace("{route}", arrival.shortName).replace("{previous}", String(previous)).replace("{minutes}", String(minutes));
        notify(`traffic:${arrival.shortName}:${previous}:${minutes}`, labels.alerts, body);
      }
      if (minutes > 0 && minutes <= threshold) {
        const body = labels.approachingAlert.replace("{route}", arrival.shortName).replace("{stop}", stop.name).replace("{minutes}", String(minutes));
        notify(`approaching:${arrival.shortName}`, labels.alerts, body);
      } else if (minutes <= 0) {
        const body = labels.arrivedAlert.replace("{route}", arrival.shortName).replace("{stop}", stop.name);
        notify(`arrived:${arrival.shortName}`, labels.alerts, body);
      }
      previousArrivals.current.set(arrival.shortName, minutes);
    });
    routes?.forEach((route, index) => {
      if (positions[index]?.data?.some((vehicle) => vehicle.nextStopId === stop.id)) {
        const body = labels.arrivedAlert.replace("{route}", route.shortName).replace("{stop}", stop.name);
        notify(`arrived:${route.shortName}`, labels.alerts, body);
      }
    });
  }, [arrivals, enabled, labels, permission, positions, routes, stop, threshold, trafficSurgeAlert]);

  const enable = async () => {
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission === "granted") {
      window.localStorage.setItem(storageKey, "true");
      setEnabled(true);
    }
  };

  return <section className="stop-alerts" aria-live="polite">
    <div className="stop-alerts-heading"><div><h3>{labels.alerts}</h3><p className="muted">{labels.alertDescription}</p></div>{enabled && <span className="mode-pill">{labels.alertsEnabled}</span>}</div>
    {!enabled ? <button className="text-button" type="button" onClick={enable}>{labels.enableAlerts}</button> : <div className="alert-settings"><label>{labels.alertThreshold}<select value={threshold} onChange={(event) => setThreshold(Number(event.target.value))}>{STOP_ALERT_THRESHOLDS_MINUTES.map((minutes) => <option value={minutes} key={minutes}>{minutes} {labels.minutes}</option>)}</select></label><button className="text-button" type="button" onClick={() => { setEnabled(false); window.localStorage.removeItem(storageKey); }}>{labels.clear}</button></div>}
    {permission === "denied" && <p className="error">{labels.alertPermissionDenied}</p>}
    {permission === "unsupported" && <p className="muted">{labels.alertPermissionUnavailable}</p>}
    {recentAlerts.map((alert) => <p className="alert-event" key={alert}>{alert}</p>)}
  </section>;
}

