import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One compact formation-level transform state relative to its designed base.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `IAutoMovieFormationMotionState` as the portable data boundary for the formation membership requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieFormationMotionState` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieFormationMotionState {
  /**
   * World-space translation added to the designed formation anchor.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `translation` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `translation` for the performance formation hierarchy membership command system contract.
   */
  translation: IAutoMovieVector3;
  /**
   * Heading offset added around the designed anchor, in degrees.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `facingOffsetDeg` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `facingOffsetDeg` for the performance formation hierarchy membership command system contract.
   */
  facingOffsetDeg: number;
  /**
   * Positive lateral and depth scale for bounded density deformation.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `spacingScale` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `spacingScale` for the performance formation hierarchy membership command system contract.
   */
  spacingScale: {
    /** Left-to-right spacing multiplier. */
    lateral: number;
    /** Front-to-back spacing multiplier. */
    depth: number;
  };
}
