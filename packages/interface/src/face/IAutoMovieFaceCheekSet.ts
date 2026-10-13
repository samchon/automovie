import { IAutoMovieFaceCheek } from "./IAutoMovieFaceCheek";

/**
 * The cheek PAIR of an {@link IAutoMovieFace}.
 *
 * **Side rule:** when only ONE of `left`/`right` is defined, it applies to BOTH
 * cheeks (the symmetric shorthand); when both are defined, each side stands
 * alone.
 *
 * @evidence contracts/common.md#principled-implementation The cheek pair's sides are resolved by `flattenFace`: a lone defined cheek feeds both `cheekFullness` targets and two defined cheeks each feed their own.
 * @evidence contracts/common.md#clear-and-simple-design Holds only the two sides, since no trait relates the cheeks to each other the way spacing relates the eyes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Left feeds the `L` suffix and right the `R` suffix as the subject sees them, through the same loop that resolves eyes and brows rather than cheek-specific code.
 * @evidence contracts/common.md#meaningful-documentation States the side rule for one versus two defined cheeks, and each member says when it applies to both cheeks.
 * @author Samchon
 */
export interface IAutoMovieFaceCheekSet {
  /**
   * The subject's LEFT cheek; applies to BOTH cheeks when `right` is omitted.
   */
  left?: IAutoMovieFaceCheek;

  /**
   * The subject's RIGHT cheek; applies to BOTH cheeks when `left` is omitted.
   */
  right?: IAutoMovieFaceCheek;
}
