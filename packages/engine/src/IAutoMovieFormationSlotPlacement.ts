import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one member of a unit really stands, and whether it is there at all.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-group-state Carries the resolved presence and world transform after group state and one sparse member exception are composed.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Defines the placement result shared by rendering, measurement, and validation for one exception slot.
 */
export interface IAutoMovieFormationSlotPlacement {
  /**
   * Whether this member is drawn, measured and counted at this time.
   *
   * @evidence requirements/formations/heroes-variation-and-state.md#formation-group-state Applies the member exception's retained presence state to drawing, measurement, and quantity.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Exposes removal and return as an explicit sparse-member outcome.
   */
  present: boolean;
  /**
   * World-space position in meters.
   *
   * @evidence requirements/formations/layouts-and-slots.md#formation-local-frame Reports the world position obtained after rotating the member's local exception with the unit.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Preserves the slot's local-frame assignment through group and member motion composition.
   */
  position: IAutoMovieVector3;
  /**
   * World-space heading in degrees.
   *
   * @evidence requirements/formations/heroes-variation-and-state.md#formation-group-state Combines designed facing, group turn, and the member's retained facing exception.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Reports the resolved orientation of the sparse member channel.
   */
  facingDeg: number;
}
