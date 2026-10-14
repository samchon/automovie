import type { IAutoMoviePropSpec } from "@automovie/interface";
import { inSpace } from "./inSpace";
import { boxProp } from "./boxProp";

/**
 * A prop in the cell-less annex: located by name, not by geometry.
 *
 * Behavior: Constructs the original crate located in the cell-less annex for real semantic-container placement tests.
 * Expectation basis: The authored annex citation carries no geometric volume, so the caller's distant accepted position follows that supported silence rather than a saved result.
 * Cases: Keeps the original in-space-only relation, null footprint and empty clearances; bounded-room containment cases are separate.
 * Execution: The existing owning entries call crate during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function crate(): IAutoMoviePropSpec { return ({
  ...boxProp("crate"),
  placement: { relations: [inSpace("annex")], footprint: null, clearance: [] },
}); }
