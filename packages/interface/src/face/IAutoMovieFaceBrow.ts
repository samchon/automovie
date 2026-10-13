/**
 * Traits of one eyebrow: signed morph weights in `[-2, 2]`, with `0` or
 * omission meaning unchanged.
 *
 * Lives under {@link IAutoMovieFaceBrowSet.left} or `right`; when it is the
 * only side stated, it applies to both brows. `height` projects onto the
 * `browHeightR` and `browHeightL` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` reads `height` from the stated side for each of `browHeightR` and `browHeightL`, falling back to the other side when one is absent, and reports the path of the side it actually read.
 * @evidence contracts/common.md#clear-and-simple-design One side type serves both brows, so asymmetry is two instances of the same record rather than paired left and right fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mirroring of a lone side is the documented shorthand of the set, not a fallback that hides a missing value; a weight outside `[-2, 2]` is reported by `validateFace` at the side's own path.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, the lone-side rule, and the morph targets the leaf drives; the member gives each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieFaceBrow {
  /**
   * Vertical position of the brow: `+` raises it off the eye toward an open,
   * surprised look, `-` settles it low and heavy.
   */
  height?: number;
}
