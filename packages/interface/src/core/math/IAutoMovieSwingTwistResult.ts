import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";

/**
 * Fresh mutable factors with input rotation = swing * twist under the unit-
 * rotation and usable-axis premises. The twist axis is normalized internally;
 * inputs are not changed. No finite/unit input gate runs here.
 *
 * Projection length hypot(dot(rotation.xyz, normalizedAxis), rotation.w)
 * below 1e-12 chooses identity twist and copies the whole input into swing.
 */
export interface IAutoMovieSwingTwistResult {
  /** Residual orientation after removing twist on the right. */
  swing: IAutoMovieQuaternion;

  /** Rotation about the supplied axis, or identity near degeneracy. */
  twist: IAutoMovieQuaternion;
}