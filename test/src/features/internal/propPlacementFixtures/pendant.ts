import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** Hung from a building element. */
export const pendant = (): IAutoMoviePropSpec => ({
  ...boxProp("pendant"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "suspended",
        target: { kind: "element", environment: "house", element: "ceiling" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});
