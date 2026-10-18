import type { BusStop, Locale } from "../../../../../shared/api/src/index";
import { TtcMap } from "../../../shared/components/TtcMap";
import { usePlanner } from "../hooks/usePlanner";
import { PlannerControls } from "../components/PlannerControls";
import { PlanInsights } from "../components/PlanInsights";
import type { Labels } from "../../../shared/constants/translations";

export function PlanPage({ locale, labels, stops, trafficEnabled, onTrafficChange }: { locale: Locale; labels: Labels; stops: BusStop[]; trafficEnabled: boolean; onTrafficChange: (enabled: boolean) => void }) {
  const planner = usePlanner(locale);
  return <section className="planner">
    <PlannerControls labels={labels} {...planner}>
      <PlanInsights labels={labels} locale={locale} from={planner.from} to={planner.to} googleRoutes={planner.googleRoutes} whatIf={planner.whatIf} durationMinutes={planner.durationMinutes} />
    </PlannerControls>
    <TtcMap stops={stops} from={planner.from} to={planner.to} onPick={planner.pickPoint} trafficEnabled={trafficEnabled} onTrafficChange={onTrafficChange} />
  </section>;
}
