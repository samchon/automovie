import type { IAutoMovieHumanBindingArm } from "./IAutoMovieHumanBindingArm";
import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";

/**
 * The binding tree of one body: the limbs skin passes down, from the hips to
 * the digits, and the two arms beside the trunk.
 *
 * @evidence contracts/common.md#meaningful-documentation States each field's meaning.
 */
export interface IAutoMovieHumanBindingTree {
  /** The trunk's first limb. */
  root: IAutoMovieHumanBindingLimb;

  /** The chest bone's slot, where an arm's cut leaves its skin. */
  chest: number;

  /** Each arm: its limb and the trunk-side limbs it is compared against. */
  arms: IAutoMovieHumanBindingArm[];
}
