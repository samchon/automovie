import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Nose traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * `0`/omitted meaning the template's nose unchanged. The leaves project onto the
 * `noseLength`, `noseWidth` and `noseProjection` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation Three leaves projected one to one by `flattenFace` onto `noseLength`, `noseWidth` and `noseProjection` and applied as additive template deltas.
 * @evidence contracts/common.md#clear-and-simple-design A flat group without sides, since the nose is a midline feature with one target per trait.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This vocabulary has no bridge, hump or tip-angle control; those exist only on `IAutoMovieHeadNose`, and nothing converts between the two documents.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, the unchanged meaning of omission, the target names, and the direction of positive length, width and projection.
 * @author Samchon
 */
export interface IAutoMovieFaceNose {
  /** Vertical length of the nose: `+` longer (the tip drops). */
  length?: AutoMovieFaceWeight;

  /** Width of the nostrils / alar base: `+` broader. */
  width?: AutoMovieFaceWeight;

  /** Forward projection of the nose tip: `+` more prominent in profile. */
  projection?: AutoMovieFaceWeight;
}
