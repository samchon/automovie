import type { IAutoMoviePlantingBranch } from "./IAutoMoviePlantingBranch";
import type { IAutoMoviePlantingLeaf } from "./IAutoMoviePlantingLeaf";
import type { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The derived structure of one planting recipe at its authored growth state.
 *
 * Derivation restarts from the complete recipe without accumulating playback
 * state. Replaying the same admitted inputs under the same numeric
 * implementation repeats that derivation; this record supplies no independently
 * observed cross-host or GPU bit-equality certificate.
 *
 * Every coordinate here is in the recipe's own frame, with the trunk's base at
 * the origin. That is what makes one derived structure serve a whole bed: the
 * cluster's placements carry the world transforms, and a renderer composes the
 * two. A consumer that read these as world coordinates would draw forty ferns
 * on top of each other at the origin.
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
   * Recipe-frame envelope of emitted stems and planar XY leaf cards, or `null`
   * when no geometry emerged. Stem support uses the larger end radius; leaf
   * support includes all four corners after emitted scale, rotation and
   * translation. Installation consumers carry its eight corners through each
   * member transform before checking clearance.
   */
  bounds: IAutoMovieSoftBounds | null;
}
