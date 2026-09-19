import { IAutoMovieFormationSlotState } from "@automovie/interface";

/**
 * The state a member holds when nothing has happened to it in particular.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-group-state Defines the neutral sparse-member exception as present, undisplaced, and unturned relative to group state.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Provides the identity member channel used when no slot-specific cue applies.
 */
export const IDENTITY_FORMATION_SLOT_STATE: IAutoMovieFormationSlotState = {
  present: true,
  offset: { x: 0, y: 0, z: 0 },
  facingOffsetDeg: 0,
};
