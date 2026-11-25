import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";

/**
 * Quaternion factors used by distal-twist distribution and hinged-chain
 * orientation error.
 */
export namespace IAutoMovieSwingTwist {
  /**
   * Fresh mutable factors with input rotation = swing * twist under the
   * unit-rotation and usable-axis premises. The twist axis is expressed in the
   * same frame as the input and normalized internally; inputs are not changed.
   * No finite/unit input gate runs here.
   *
   * Projection length hypot(dot(rotation.xyz, normalizedAxis), rotation.w)
   * below 1e-12 chooses identity twist and copies the whole input into swing.
   * This is a numerical near-degeneracy convention, not only an exact half-turn
   * test.
   */
  export type IResult = {
    /**
     * Residual orientation after removing twist on the right; near degeneracy
     * copies the input rotation.
     */
    swing: IAutoMovieQuaternion;

    /**
     * Rotation about the supplied axis; identity when projected quaternion
     * length is below 1e-12.
     */
    twist: IAutoMovieQuaternion;
  };
}
