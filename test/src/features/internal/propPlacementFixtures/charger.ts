import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * Plugged into the table's `socket`.
 *
 * Behavior: Constructs the original charger attached to the table socket and located in the room for real placement tests.
 * Expectation basis: The authored table/plug socket citation defines the valid input; caller mutation and located refusal expectations are independent of validator output.
 * Cases: Preserves socket attachment and its original null footprint/empty clearances, with wrong affordance and occupancy/contact neighbors owned by the existing entries.
 * Execution: The existing owning entries call charger during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function charger(): IAutoMoviePropSpec { return ({
  ...boxProp("charger"),
  placement: {
    relations: [
      inSpace("room"),
      {
        kind: "attached",
        target: { kind: "prop-affordance", prop: "table", affordance: "plug" },
      },
    ],
    footprint: null,
    clearance: [],
  },
}); }
