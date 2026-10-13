import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/** Stands against a boundary, on the floor, with a declared use footprint. */
export const cabinet = (): IAutoMoviePropSpec => ({
  ...boxProp("cabinet"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "against-boundary",
        target: {
          kind: "boundary",
          environment: "house",
          boundary: "room-wall",
        },
      },
      {
        kind: "on-support",
        target: { kind: "surface", environment: "house", surface: "floor" },
      },
    ],
    footprint: {
      min: { x: -0.25, y: -0.3, z: -0.15 },
      max: { x: 0.25, y: 0.3, z: 0.15 },
    },
    clearance: [],
  },
});
