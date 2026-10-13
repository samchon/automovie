import type { IAutoMoviePropSpec } from "@automovie/interface";
import { createModel } from "../fixtures";
import { inSpace } from "./inSpace";

/** The leaf filling the doorway, sized to sit inside its reveal. */
export const door = (): IAutoMoviePropSpec => ({
  node: "door",
  model: {
    ...createModel(null),
    id: "door",
    parts: [
      {
        id: "panel",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 0.9, height: 1.9, depth: 0.05 },
        },
        material: "mat-1",
        attachedBone: null,
        transform: null,
      },
    ],
  },
  articulation: null,
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "fill-opening",
        target: { kind: "opening", environment: "house", opening: "doorway" },
      },
    ],
    footprint: null,
    clearance: [],
  },
});
