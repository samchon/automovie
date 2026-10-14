import type { IAutoMoviePropSpec } from "@automovie/interface";
import { createModel } from "../fixtures";

/**
 * A box prop of the default 0.4 x 0.6 x 0.2 model, with no relations yet.
 *
 * Behavior: Builds the original skeleton-less box spec used by the furnished registry and its real forging/placement tests.
 * Expectation basis: The existing createModel fixture authors its 0.4 by 0.6 by 0.2 proxy; this constructor is an input owner and does not independently measure tessellation or imported appearance.
 * Cases: Keeps the supplied node/model identity, null articulation and absent placement until a specific furnished prop adds its original relations.
 * Execution: The existing owning entries call boxProp during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function boxProp(node: string): IAutoMoviePropSpec { return ({
  node,
  model: { ...createModel(null), id: node },
  articulation: null,
}); }
