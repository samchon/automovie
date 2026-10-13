import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** Plugged into the table's `socket`. */
export const charger = (): IAutoMoviePropSpec => ({
  ...boxProp("charger"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "attached",
        target: { kind: "prop-affordance", prop: "table", affordance: "plug" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});
