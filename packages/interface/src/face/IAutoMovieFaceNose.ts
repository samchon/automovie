/**
 * Nose traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * `0`/omitted meaning the template's nose unchanged. The leaves project onto the
 * `noseLength`, `noseWidth` and `noseProjection` morph targets.
 *
 * @author Samchon
 */
export interface IAutoMovieFaceNose {
  /** Vertical length of the nose: `+` longer (the tip drops). */
  length?: number;

  /** Width of the nostrils / alar base: `+` broader. */
  width?: number;

  /** Forward projection of the nose tip: `+` more prominent in profile. */
  projection?: number;
}
