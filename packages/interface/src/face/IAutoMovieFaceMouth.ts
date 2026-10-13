import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";
import { IAutoMovieFaceLips } from "./IAutoMovieFaceLips";

/**
 * Mouth traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * `0`/omitted meaning the template's mouth unchanged. `width` and `height`
 * project onto the `mouthWidth` and `mouthHeight` morph targets. A smile or any
 * other movement belongs to {@link IAutoMovieExpression}, not here.
 *
 * @author Samchon
 */
export interface IAutoMovieFaceMouth {
  /** Width of the mouth: `+` a wider smile line. */
  width?: AutoMovieFaceWeight;

  /** Vertical position of the whole mouth: `+` higher toward the nose. */
  height?: AutoMovieFaceWeight;

  /** The lips themselves. See {@link IAutoMovieFaceLips}. */
  lips?: IAutoMovieFaceLips;
}
