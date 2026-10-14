import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * Stands against a boundary, on the floor, with a declared use footprint.
 *
 * Behavior: Constructs the original floor-supported, wall-related cabinet with a declared use footprint for real containment, overlap and support tests.
 * Expectation basis: The literal footprint and floor/boundary citations independently define the authored geometry that caller mutations challenge.
 * Cases: Keeps its room, wall and floor relations and original footprint extents; degenerate, removed, cross-building, second-support and displaced cases remain in existing callers.
 * Execution: The existing owning entries call cabinet during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function cabinet(): IAutoMoviePropSpec { return ({
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
}); }
