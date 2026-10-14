/**
 * Lip traits of an {@link IAutoMovieFace}'s mouth: signed morph weights in
 * `[-2, 2]`, with `0` or omission leaving the template's lips unchanged.
 *
 * `fullness` drives the single `lipFullness` morph target, so the upper and
 * lower lip are not separately addressable.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` reads `mouth.lips.fullness` into `lipFullness`, the one lip target of the face vocabulary, and `morphFace` adds that weight times the target's delta.
 * @evidence contracts/common.md#clear-and-simple-design A lips record nested under the mouth keeps the anatomy readable while holding only the trait the vocabulary can actually drive.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-lip field is offered that would have to be averaged or dropped on the way to the single target; the gap that upper and lower lips cannot differ is stated instead.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, the `lipFullness` target, and that the two lips cannot be set apart; the member gives each sign's direction about the lip seam.
 * @author Samchon
 */
export interface IAutoMovieFaceLips {
  /**
   * Vertical thickness of the lips about the lip seam: `+` fuller, `-` thinner.
   */
  fullness?: number;
}
