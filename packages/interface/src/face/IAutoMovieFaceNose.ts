/**
 * Nose traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * with `0` or omission leaving the template's nose unchanged.
 *
 * The nose is unsided, and its leaves drive the `noseLength`, `noseWidth` and
 * `noseProjection` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` maps `nose.length`, `nose.width` and `nose.projection` one-to-one onto `noseLength`, `noseWidth` and `noseProjection`, and `morphFace` sums each weight times its target delta.
 * @evidence contracts/common.md#clear-and-simple-design Three optional leaves on one midline record, with no side split, match the three nose targets of the vocabulary exactly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nostril width is not a separate trait derived from `width`; the single width target is all the vocabulary carries, and an out-of-range weight is reported rather than clamped.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, that the nose is unsided, and its three morph targets; members give each sign's visible direction.
 * @author Samchon
 */
export interface IAutoMovieFaceNose {
  /** Vertical length of the nose: `+` longer, with the tip dropping. */
  length?: number;

  /** Width of the nostrils and alar base: `+` broader, `-` narrower. */
  width?: number;

  /** Forward projection of the nose tip: `+` more prominent in profile. */
  projection?: number;
}
