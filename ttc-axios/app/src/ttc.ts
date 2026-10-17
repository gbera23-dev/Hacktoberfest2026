import { TtcApi } from "../../api/src/index";

// The same-origin path is handled by the local/production server proxy.
export const ttc = new TtcApi({ baseUrl: "/api/ttc" });
