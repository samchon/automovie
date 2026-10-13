import { IAutoMovieSoftNodeTransform } from "./IAutoMovieSoftNodeTransform";
import { IAutoMovieWearableSoftActorPose } from "./IAutoMovieWearableSoftActorPose";

/** Complete primary-motion snapshot for one absolute soft step. */
export interface IAutoMovieWearableSoftFrame {
  /** Absolute fixed-step index. */
  step: number;
  /** Evaluated object and platform nodes. */
  nodes: readonly IAutoMovieSoftNodeTransform[];
  /** Evaluated actors and bones. */
  actors: readonly IAutoMovieWearableSoftActorPose[];
}
