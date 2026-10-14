import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * Rests on the table's `stack-top`, and keeps a service volume beside it.
 *
 * Behavior: Constructs the original table-supported lamp and its shade-service keep-out volume for real placement and support tests.
 * Expectation basis: The authored top citation and local clearance box determine expected support/clearance cases; the factory supplies inputs rather than an independent validator.
 * Cases: Preserves room, table stack-top and clearance identity/extents; floating/sinking/off-host and invalid/overlapping clearance cases remain in their entries.
 * Execution: The existing owning entries call lamp during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function lamp(): IAutoMoviePropSpec { return ({
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
}); }
