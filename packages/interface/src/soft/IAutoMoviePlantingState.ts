import { IAutoMoviePlantingBranch } from "./IAutoMoviePlantingBranch";
import { IAutoMoviePlantingLeaf } from "./IAutoMoviePlantingLeaf";
import { IAutoMovieSoftBounds } from "./IAutoMovieSoftBounds";

/**
 * The derived structure of one planting recipe at its authored growth state.
 *
 * Derivation restarts from the complete recipe without accumulating playback state. Replaying the same admitted inputs under the same numeric implementation repeats that derivation; this record supplies no independently observed cross-host or GPU bit-equality certificate.
 *
 * Every coordinate here is in the recipe's own frame, with the trunk's base at the origin. That is what makes one derived structure serve a whole bed: the cluster's placements carry the world transforms, and a renderer composes the two. A consumer that read these as world coordinates would draw forty ferns on top of each other at the origin.
 *
 * @evidence contracts/common.md#principled-implementation growPlanting derives path-seeded depth-first branches and leaves at one growth stage; branch endpoints remain recipe-local so cluster TRS can instance the same structure.
 * @evidence contracts/common.md#clear-and-simple-design One result separates structure derivation from cluster arrangement and includes its recipe identity and stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds include maximum-end-radius stem support and all four transformed XY leaf-card corners, matching emitted geometry rather than guessing foliage width; this CPU envelope does not certify GPU rounding or continuous inclusion in a non-convex room union.
 * @evidence contracts/common.md#meaningful-documentation The recipe frame, stable branch/leaf order, nullable empty result and complete emitted stem/card envelope are stated for installation consumers composing member scale, rotation and translation.
 * @author Samchon
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
   * Recipe-frame envelope of emitted stems and planar XY leaf cards, or `null` when no geometry emerged. Stem support uses the larger end radius; leaf support includes all four corners after emitted scale, rotation and translation. Installation consumers carry its eight corners through each member transform before checking clearance.
   */
  bounds: IAutoMovieSoftBounds | null;
}
