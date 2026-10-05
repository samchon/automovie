/**
 * The face producer's evaluated skin of a one-skin generation, by skin vertex:
 * the head skin, and the band's appended body cells when the generation has
 * band rows.
 *
 * @evidence contracts/common.md#principled-implementation The forming step reads the face producer's skin by vertex, whether it came from a built model or from the rest evaluation alone.
 * @evidence contracts/common.md#clear-and-simple-design Two position arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A band view vertex the band part does not draw is never read.
 * @evidence contracts/common.md#meaningful-documentation States what each array holds and how it is indexed.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the face frame, before the head carry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record holds skin positions, not parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The forming step owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceRest {
  /** Head skin positions, flat XYZ by head skin vertex. */
  head: number[];

  /** Band surface positions, flat XYZ by band view vertex, when the generation has band rows. */
  band?: number[];
}
