import { IAutoMovieSoftNodeTransform } from "./IAutoMovieSoftNodeTransform";
import { IAutoMovieWearableSoftActorPose } from "./IAutoMovieWearableSoftActorPose";
/**
 * Complete node/actor primary-motion snapshot supplied at one absolute soft step.
 *
 * @evidence contracts/common.md#principled-implementation One step joins node and actor frames that must be temporally coherent before local anchors and body capsules become one cloth boundary.
 * @evidence contracts/common.md#clear-and-simple-design Primary-motion evaluation stays with the caller, while simulateAutoMovieWearableSoftBody consumes plain snapshots rather than a playback or rendering service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete zero-through-target snapshot admission refuses missing steps and named participants instead of reusing a stale prior frame.
 * @evidence contracts/common.md#meaningful-documentation States absolute step and the evaluated node/actor populations that constitute that step's supplied frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A snapshot interface executes no sampling or boundary conversion; those costs belong to the producing caller and wearable resolver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each step's snapshot can be borrowed by all its moving bindings, but this row owns no temporal cache policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns readonly snapshot arrays and their frame references; no viewer, motion cursor or live solver task is embedded.
 * @author Samchon
 */
export interface IAutoMovieWearableSoftFrame {
  /** Absolute fixed-step index. */
  step: number;

  /** Evaluated object and platform nodes. */
  nodes: readonly IAutoMovieSoftNodeTransform[];

  /** Evaluated actors and bones. */
  actors: readonly IAutoMovieWearableSoftActorPose[];
}
