import type { IHumanSourceAuthoredCell } from "./IHumanSourceAuthoredCell.ts";
import type { IHumanSourceCompactedTopology } from "./IHumanSourceCompactedTopology.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";

/** Frozen original ownership and the provider's actual reindexed source cells. */
export interface IHumanSourceAuthoredCutInput {
  original: IHumanSourceCut;
  root: IHumanSourceCompactedTopology;
  cells: readonly IHumanSourceAuthoredCell[];
  /** First original triangle ordinal per sampled polygon. */
  originalPolygonParents: Int32Array;
  /** Original oriented parent triples, proving retained native incidence. */
  originalParentTriangles: Int32Array;
}
