import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** Rests on the table's `stack-top`, and keeps a service volume beside it. */
export const lamp = (): IAutoMoviePropSpec => ({
  ...boxProp("lamp"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "on-support",
        target: { kind: "prop-affordance", prop: "table", affordance: "top" },
      },
    ],
    footprint: null,
    clearance: [
      {
        id: "shade-service",
        min: { x: 1, y: -0.5, z: -0.5 },
        max: { x: 2, y: 0.5, z: 0.5 },
      },
    ],
  },
});
