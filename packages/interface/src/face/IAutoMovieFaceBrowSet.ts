import { IAutoMovieFaceBrow } from "./IAutoMovieFaceBrow";

/**
 * The eyebrow PAIR of an {@link IAutoMovieFace}.
 *
 * **Side rule:** when only ONE of `left`/`right` is defined, it applies to BOTH
 * brows (the symmetric shorthand); when both are defined, each side stands
 * alone (a raised single brow).
 *
 * @evidence contracts/common.md#principled-implementation Two optional sides resolved by `flattenFace`: for each of the right and left brow targets it takes that side when defined and the other side otherwise, so one side is the symmetric shorthand and two sides are independent.
 * @evidence contracts/common.md#clear-and-simple-design No trait relates the two brows to each other, so the pair holds only `left` and `right`, and no `both` field exists because the lone-side rule already expresses symmetry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sides are the subject's own: `left` feeds the `L` target and `right` the `R` target with no viewer-side flip, the same mapping the eye and cheek pairs use.
 * @evidence contracts/common.md#meaningful-documentation States the side rule for one versus two defined brows, and each member says when it applies to both brows.
 * @author Samchon
 */
export interface IAutoMovieFaceBrowSet {
  /** The subject's LEFT brow; applies to BOTH brows when `right` is omitted. */
  left?: IAutoMovieFaceBrow;

  /** The subject's RIGHT brow; applies to BOTH brows when `left` is omitted. */
  right?: IAutoMovieFaceBrow;
}
