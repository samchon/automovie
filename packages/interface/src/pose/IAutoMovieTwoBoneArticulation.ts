import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";

/**
 * The two bone-local articulation deltas `twoBoneChainArticulation` produces.
 *
 * Apply `upper` on the chain-root joint and `lower` on the mid joint; each is
 * multiplied after the bone's rest rotation, as `resolvePose` composes
 * articulation. The caller lowers them into clinical angles with its own axes
 * and rest frames. `solvePreparedChainPlant`, which `fitChainToTarget` runs for
 * planted legs, applies it to hips and knees.
 */
export interface IAutoMovieTwoBoneArticulation {
  /**
   * Bone-local articulation delta for the chain-root joint, such as a hip or
   * shoulder.
   */
  upper: IAutoMovieQuaternion;

  /** Bone-local articulation delta for the mid joint, such as a knee or elbow. */
  lower: IAutoMovieQuaternion;
}
