import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";
import { IAutoMovieFaceLips } from "./IAutoMovieFaceLips";

/**
 * Mouth traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * `0`/omitted meaning the template's mouth unchanged. `width` and `height`
 * project onto the `mouthWidth` and `mouthHeight` morph targets. A smile or any
 * other movement belongs to {@link IAutoMovieExpression}, not here.
 *
 * @evidence contracts/common.md#principled-implementation `width` and `height` project onto `mouthWidth` and `mouthHeight` and `lips` carries the nested fullness leaf, all through the single-target table of `flattenFace` and applied as additive deltas.
 * @evidence contracts/common.md#clear-and-simple-design Mouth size and placement here, lip volume one level down, matching how a person describes a mouth before its lips.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each leaf passes unchanged to one target, and the record has no smile or opening field because mouth motion is the expression contract's job.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, the unchanged meaning of omission, the target names, the direction of width and vertical position, and where mouth movement belongs instead.
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
