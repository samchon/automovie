import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** Hung from the table's `hook`. */
export const chime = (): IAutoMoviePropSpec => ({
  ...boxProp("chime"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "suspended",
        target: { kind: "prop-affordance", prop: "table", affordance: "peg" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});
