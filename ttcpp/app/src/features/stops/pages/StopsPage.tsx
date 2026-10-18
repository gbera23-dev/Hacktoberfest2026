import type { BusStop, Locale } from "../../../../../shared/api/src/index";
import { TtcMap } from "../../../shared/components/TtcMap";
import { StopPanel } from "../components/StopPanel";
import type { Labels } from "../../../shared/constants/translations";

type Props = {
  locale: Locale;
  labels: Labels;
  stops: BusStop[];
  mapStops: BusStop[];
  selectedStop?: BusStop;
  onSelect: (stop: BusStop) => void;
  trafficEnabled: boolean;
  onTrafficChange: (enabled: boolean) => void;
};

export function StopsPage({ locale, labels, stops, mapStops, selectedStop, onSelect, trafficEnabled, onTrafficChange }: Props) {
  return <div className="stops-page">
    <TtcMap locale={locale} stops={mapStops} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} onStopSelect={onSelect} />
    <StopPanel locale={locale} labels={labels} stops={stops} selectedStop={selectedStop} onSelect={onSelect} />
  </div>;
}
