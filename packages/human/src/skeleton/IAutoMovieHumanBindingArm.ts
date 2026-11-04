import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";

/**
 * An arm, whose skin beside the trunk is decided by capsule.
 *
 * @evidence contracts/common.md#meaningful-documentation States each field's meaning and unit.
 */
export interface IAutoMovieHumanBindingArm {
  /** The girdle limb that starts it. */
  limb: IAutoMovieHumanBindingLimb;

  /** Every limb of this arm. */
  own: IAutoMovieHumanBindingLimb[];

  /** Half of the comparison's ramp, metres. */
  contest: number;
}
