import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** Fixed to a building element rather than to another prop. */
export const sconce = (): IAutoMoviePropSpec => ({
  ...boxProp("sconce"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "attached",
        target: { kind: "element", environment: "house", element: "wall" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});
