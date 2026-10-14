import type { IAutoMoviePropSpec } from "@automovie/interface";

import { boxProp } from "./boxProp";
import { inSpace } from "./inSpace";

/**
 * Hung from the table's `hook`.
 *
 * Behavior: Constructs the original chime suspended from the table hook for real affordance and overlap tests.
 * Expectation basis: The authored table/peg hook citation defines its input; support-kind and overlap outcomes are asserted by the original callers.
 * Cases: Preserves room and prop-affordance suspension with null footprint/empty clearances; wrong hook kind and undeclared contact mutations remain unchanged.
 * Execution: The existing owning entries call chime during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function chime(): IAutoMoviePropSpec {
  return {
    ...boxProp("chime"),
    placement: {
      relations: [
        inSpace("room"),
        {
          kind: "suspended",
          target: { kind: "prop-affordance", prop: "table", affordance: "peg" },
        },
      ],
      footprint: null,
      clearance: [],
    },
  };
}
