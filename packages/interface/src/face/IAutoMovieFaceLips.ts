import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Lip traits of an {@link IAutoMovieFace}'s mouth: signed morph weights in `[-2,
 * 2]`, `0`/omitted meaning the template's lips unchanged. `fullness` projects
 * onto the single `lipFullness` morph target; the upper and lower lip are not
 * separately addressable.
 *
 * @evidence contracts/common.md#principled-implementation One leaf, `fullness`, projected by `flattenFace` onto the `lipFullness` target at path `mouth.lips.fullness` and applied as a linear delta that the template defines about the lip seam.
 * @evidence contracts/common.md#clear-and-simple-design Nested inside the mouth so lip volume is edited apart from the mouth's width and vertical position.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A single symmetric target: upper and lower lips are not distinguished in this vocabulary, and nothing splits the weight between them.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, the unchanged meaning of omission, the target name, that the two lips share one control, and the direction of positive and negative fullness.
 * @author Samchon
 */
export interface IAutoMovieFaceLips {
  /**
   * Vertical thickness of the lips about the lip seam: `+` fuller, `-` thinner.
   */
  fullness?: AutoMovieFaceWeight;
}
