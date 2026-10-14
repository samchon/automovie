import type { IAutoMoviePropSpec } from "@automovie/interface";

import { createModel } from "../fixtures";
import { inSpace } from "./inSpace";

/**
 * The leaf filling the doorway, sized to sit inside its reveal.
 *
 * Behavior: Constructs the original skeleton-less leaf spec that fills the authored doorway for real opening-fit and passage tests.
 * Expectation basis: The literal 0.9 by 1.9 by 0.05 proxy is smaller than the independently authored opening-fill proxy, defining valid fit without reading a placement result.
 * Cases: Preserves room/fill-opening relations, original panel geometry and null footprint/empty clearances; scaled and spaceless fitting failures remain in owning entries.
 * Execution: The existing owning entries call door during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function door(): IAutoMoviePropSpec {
  return {
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
  };
}
