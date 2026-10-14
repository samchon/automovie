import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * Fixed to a building element rather than to another prop.
 *
 * Behavior: Constructs the original room-located sconce attached to the wall element for real relation and passage validation.
 * Expectation basis: The literal house/wall citation defines its authored relation independently of returned diagnoses.
 * Cases: Keeps the building-element attachment, null footprint and empty clearances; dangling and blocked-passage mutations remain in owning entries.
 * Execution: The existing owning entries call sconce during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function sconce(): IAutoMoviePropSpec { return ({
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
}); }
