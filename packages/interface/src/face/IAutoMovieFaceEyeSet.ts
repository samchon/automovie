import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";
import { IAutoMovieFaceEye } from "./IAutoMovieFaceEye";

/**
 * The eye PAIR of an {@link IAutoMovieFace}.
 *
 * **Side rule (read this first):** when only ONE of `left`/`right` is defined,
 * it applies to BOTH eyes (the symmetric shorthand: most faces need nothing
 * more). When BOTH are defined, each side stands alone and applies only to its
 * own eye (uneven eyes). There is no separate "both" field.
 *
 * Pair-level traits (the relation between the two eyes) live here; traits of an
 * eye itself live in {@link IAutoMovieFaceEye}. Sides are the SUBJECT's
 * left/right. The Set/single naming split is deliberate: "EyeSet" vs "Eye"
 * cannot be confused by a tool-calling model the way "Eyes" vs "Eye" can.
 *
 * @evidence contracts/common.md#principled-implementation A pair-level `spacing` scalar plus two optional sides; `flattenFace` emits `eyeSpacingR` and `eyeSpacingL` as each resolved side's offset plus `spacing`, so spacing alone still moves both eyes when no side is defined.
 * @evidence contracts/common.md#clear-and-simple-design Relations between the eyes live here and per-eye traits in `IAutoMovieFaceEye`, with the `Set` suffix chosen so a model cannot confuse the pair type with the single one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts With only `spacing` set the reported path is `eyes.spacing`, and with a side's offset set the summed weight is reported at that offset; both come from the one mapping validation and morphing share, with no separate spacing check.
 * @evidence contracts/common.md#meaningful-documentation States the side rule first, that there is no `both` field, the subject-side convention, the direction of spacing, and that it is range-checked together with each side's offset.
 * @author Samchon
 */
export interface IAutoMovieFaceEyeSet {
  /**
   * Distance between the eyes: `+` wide-set, `-` close-set. Adds to each side's
   * {@link IAutoMovieFaceEye.offset}, and the `[-2, 2]` range applies to that
   * sum per side.
   */
  spacing?: AutoMovieFaceWeight;

  /** The subject's LEFT eye; applies to BOTH eyes when `right` is omitted. */
  left?: IAutoMovieFaceEye;

  /** The subject's RIGHT eye; applies to BOTH eyes when `left` is omitted. */
  right?: IAutoMovieFaceEye;
}
