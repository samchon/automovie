import { IAutoMoviePlantingBranch } from "./IAutoMoviePlantingBranch";
import { IAutoMoviePlantingLeaf } from "./IAutoMoviePlantingLeaf";
import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The derived structure of one planting recipe at its authored growth state.
 *
 * A pure function of the recipe. Nothing accumulates between calls, so two
 * derivations of the same record are bit-identical and a plant re-derived in a
 * later chunk of the same render is the same plant.
 *
 * Every coordinate here is in the **recipe's own frame**, with the trunk's base
 * at the origin. That is what makes one derived structure serve a whole bed:
 * the cluster's placements carry the world transforms, and a renderer composes
 * the two. A consumer that read these as world coordinates would draw forty
 * ferns on top of each other at the origin.
 */
export interface IAutoMoviePlantingState {
  /** Identity of the recipe this structure was derived from. */
  domain: string;

  /** Growth state the structure was derived at. */
  stage: number;

  /** Branch segments in a stable depth-first authored order. */
  branches: IAutoMoviePlantingBranch[];

  /** Leaf occurrences, in the order of the branches that bear them. */
  leaves: IAutoMoviePlantingLeaf[];

  /**
   * Recipe-frame extent of the derived structure, or `null` when nothing
   * emerged at all — a plant at growth state `0`, or one pruned away entirely.
   */
  bounds: IAutoMovieSoftBounds | null;
}
