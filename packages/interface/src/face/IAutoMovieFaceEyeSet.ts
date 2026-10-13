import { IAutoMovieFaceEye } from "./IAutoMovieFaceEye";

/**
 * The eye pair of an {@link IAutoMovieFace}.
 *
 * When only one of `left` and `right` is stated, it applies to both eyes as the
 * symmetric shorthand most faces need. When both are stated, each applies only
 * to its own eye, which is how uneven eyes are written. There is no separate
 * field for both eyes. Sides are the subject's own.
 *
 * Traits of the relation between the two eyes live here, and traits of one eye
 * live in {@link IAutoMovieFaceEye}. The names `EyeSet` and `Eye` differ by more
 * than a plural so a tool-calling model does not confuse the pair with one eye.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` resolves the five eye targets per side from the stated side or, when one is absent, the other, and for `eyeSpacingR` and `eyeSpacingL` adds `spacing` to that side's `offset`, reporting the sum at the side's `offset` path or at `eyes.spacing` when no side states an offset.
 * @evidence contracts/common.md#clear-and-simple-design The set holds the one pair-level trait, `spacing`, beside two optional instances of the per-eye record, so symmetric eyes, uneven eyes and a pure spacing change each have exactly one spelling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The lone-side mirroring is the documented shorthand shared with brows and cheeks, never applied over a stated side, and `validateFace` range-checks the per-side spacing sum instead of each addend so a sum outside `[-2, 2]` cannot pass unreported.
 * @evidence contracts/common.md#meaningful-documentation States the lone-side shorthand, that two stated sides stay independent, whose left and right is meant, which traits belong to the pair, why the type is named `EyeSet`, and how `spacing` composes with each side's `offset` under the range.
 * @author Samchon
 */
export interface IAutoMovieFaceEyeSet {
  /**
   * Distance between the eyes: `+` wide-set, `-` close-set.
   *
   * Adds to each side's {@link IAutoMovieFaceEye.offset}, and the `[-2, 2]`
   * range applies to that sum per side. Stated alone, it moves both eyes.
   */
  spacing?: number;

  /** The subject's left eye; applies to both eyes when `right` is omitted. */
  left?: IAutoMovieFaceEye;

  /** The subject's right eye; applies to both eyes when `left` is omitted. */
  right?: IAutoMovieFaceEye;
}
