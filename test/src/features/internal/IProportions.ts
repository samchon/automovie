/**
 * Per-limb-group rest-offset multipliers for the existing synthetic rig; each defaults to one.
 */
export interface IProportions {
  /** Multiplier for the existing leg-bone offsets. */
  leg?: number;

  /** Multiplier for all offsets outside the named arm and leg groups. */
  torso?: number;

  /** Multiplier for the existing arm-bone offsets. */
  arm?: number;
}
