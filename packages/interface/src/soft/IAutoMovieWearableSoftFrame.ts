import type { IAutoMovieSoftNodeTransform } from "./IAutoMovieSoftNodeTransform";
import type { IAutoMovieWearableSoftActorPose } from "./IAutoMovieWearableSoftActorPose";

/**
 * Complete node/actor primary-motion snapshot supplied at one absolute soft
 * step.
 */
export interface IAutoMovieWearableSoftFrame {
  /** Absolute fixed-step index. */
  step: number;

  /** Evaluated object and platform nodes. */
  nodes: readonly IAutoMovieSoftNodeTransform[];

  /** Evaluated actors and bones. */
  actors: readonly IAutoMovieWearableSoftActorPose[];
}
