import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Axis-aligned world-space bounds of a compact formation range.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `IAutoMovieFormationBounds` as the portable data boundary for the formation membership requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieFormationBounds` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieFormationBounds {
  /**
   * Minimum world-space corner.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `min` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `min` for the performance formation hierarchy membership command system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Maximum world-space corner.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-membership Exposes `max` as the portable data boundary for the formation membership requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `max` for the performance formation hierarchy membership command system contract.
   */
  max: IAutoMovieVector3;
}
