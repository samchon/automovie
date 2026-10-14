import type { IAutoMoviePropSpec } from "@automovie/interface";
import { IDENTITY_TRANSFORM, createModel } from "../fixtures";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * The table every stacked, plugged, and hung prop in the room cites.
 *
 * Behavior: Constructs the original floor-supported table with stack-top, socket and hook affordances used as real placement/query targets.
 * Expectation basis: The authored 0.3m local top above its staged 0.3m centre defines 0.6m support, while the square extent is input geometry rather than an observed support result.
 * Cases: Keeps floor/room relations and all three affordance kinds; missing, wrong-kind, ambiguous and tilted/scaled host cases remain in the existing callers.
 * Execution: The existing owning entries call table during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function table(): IAutoMoviePropSpec { return ({
  ...boxProp("table"),
  model: {
    ...createModel(null),
    id: "table",
    affordances: [
      {
        id: "top",
        kind: "stack-top",
        // The table's own upper face: half of the 0.6 m proxy box, so a prop
        // resting here bears on the geometry the table actually shows.
        frame: {
          translation: { x: 0, y: 0.3, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: [
          { x: -0.5, y: 0, z: -0.5 },
          { x: 0.5, y: 0, z: -0.5 },
          { x: 0.5, y: 0, z: 0.5 },
          { x: -0.5, y: 0, z: 0.5 },
        ],
      },
      { id: "plug", kind: "socket", frame: IDENTITY_TRANSFORM, extent: null },
      { id: "peg", kind: "hook", frame: IDENTITY_TRANSFORM, extent: null },
    ],
  },
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "on-support",
        target: { kind: "surface", environment: "house", surface: "floor" },
      },
    ],
    footprint: null,
    clearance: [],
  },
}); }
