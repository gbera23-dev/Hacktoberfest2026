import type { AxiosInstance } from "axios";
import type { BusPlan, LatLng, Locale } from "./types.js";

export class TripsApi {
  constructor(private http: AxiosInstance) {}

  /** Journey planner: walk + bus, leaving now, fastest first. */
  async plan(from: LatLng, to: LatLng, locale?: Locale): Promise<BusPlan> {
    const { data } = await this.http.get<BusPlan>("/plan", {
      params: {
        fromPlace: from.join(","),
        toPlace: to.join(","),
        departMode: "leaveNow",
        modes: "WALK,BUS",
        optimize: "quick",
        locale,
      },
    });
    return data;
  }
}
