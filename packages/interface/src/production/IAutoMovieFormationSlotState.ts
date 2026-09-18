import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One member-local deviation from the unit that member stands in.
 *
 * A group cue moves every member alike. This is what one named member does
 * differently: whether it is there at all, how far it has come off the place
 * its layout put it, and how far it has turned out of the heading its unit
 * holds. The offset and the heading are stated in the unit's own frame, so a
 * member that steps left keeps stepping left after its unit turns.
 *
 * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `IAutoMovieFormationSlotState` as the portable data boundary for the formation unit local variation requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `IAutoMovieFormationSlotState` for the performance formation hierarchy membership command system contract.
 */
export interface IAutoMovieFormationSlotState {
  /**
   * Whether this member is drawn, measured and counted at all.
   *
   * False is the whole of removal: the member stops being rendered, stops being
   * measured against the ground its shot staged, and stops being counted among
   * the drawn. Its unit's designed count, bounds and centroid are unchanged,
   * because those describe the unit that was designed rather than the members
   * standing at one instant.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `present` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `present` for the performance formation hierarchy membership command system contract.
   */
  present: boolean;
  /**
   * Displacement from the member's designed place, in unit-local meters.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `offset` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `offset` for the performance formation hierarchy membership command system contract.
   */
  offset: IAutoMovieVector3;
  /**
   * Heading added to the member's placed heading, in degrees.
   *
   * @evidence requirements/formations/hierarchies-and-units.md#formation-unit-local-variation Exposes `facingOffsetDeg` as the portable data boundary for the formation unit local variation requirement.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hierarchy-membership-command Types `facingOffsetDeg` for the performance formation hierarchy membership command system contract.
   */
  facingOffsetDeg: number;
}
