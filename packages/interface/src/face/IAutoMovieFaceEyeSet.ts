import { IAutoMovieFaceEye } from "./IAutoMovieFaceEye";

/**
 * The eye pair of an {@link IAutoMovieFace}.
 *
 * When only one of `left` and `right` is stated, it applies to both eyes as the symmetric shorthand. When both are stated, each applies only to its own eye. Sides are the subject's own.
 *
 * Pair-level `spacing` adds to each resolved side's `offset`; per-eye traits live in {@link IAutoMovieFaceEye}. Equal spacing sums can be authored through different combinations of these two fields, and validation checks each sum rather than its addends independently.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` resolves the five eye targets per side from the stated side or, when one is absent, the other, and for `eyeSpacingR` and `eyeSpacingL` adds `spacing` to that side's `offset`, reporting the sum at the side's `offset` path or at `eyes.spacing` when no side states an offset.
 * @evidence contracts/common.md#clear-and-simple-design The set holds shared `spacing` beside two optional per-eye records; one stated side mirrors, two stated sides remain independent, and spacing composes additively with their offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The lone-side mirroring is the documented shorthand shared with brows and cheeks, never applied over a stated side, and `validateFace` range-checks the per-side spacing sum instead of each addend so a sum outside `[-2, 2]` cannot pass unreported.
 * @evidence contracts/common.md#meaningful-documentation States lone-side mirroring, independent stated sides, subject-relative naming, additive spacing and offsets, and validation of each resulting weight rather than the individual addends.
 * @author Samchon
 */
export interface IAutoMovieFaceEyeSet {
  /**
   * Distance between the eyes: `+` wide-set, `-` close-set.
   *
   * Adds to each side's {@link IAutoMovieFaceEye.offset}, and the finite `[-2, 2]` range applies to that sum per side. Stated alone, it drives both spacing targets.
   */
  spacing?: number;

  /** The subject's left eye; applies to both eyes when `right` is omitted. */
  left?: IAutoMovieFaceEye;

  /** The subject's right eye; applies to both eyes when `left` is omitted. */
  right?: IAutoMovieFaceEye;
}
