import { IAutoMovieFaceLips } from "./IAutoMovieFaceLips";

/**
 * Mouth traits of an {@link IAutoMovieFace}: signed morph weights in `[-2, 2]`,
 * with `0` or omission leaving the template's mouth unchanged.
 *
 * `width` and `height` drive the `mouthWidth` and `mouthHeight` morph targets.
 * These are resting shape only; a smile or any other movement belongs to
 * {@link IAutoMovieExpression}.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` reads `mouth.width` and `mouth.height` into `mouthWidth` and `mouthHeight` through its single-target table and descends into `lips` for `lipFullness`, each leaf range-checked at its own path.
 * @evidence contracts/common.md#clear-and-simple-design The mouth group carries two placement traits and the nested lips record, while movement stays on the expression contract so identity and performance never share a field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No smile or viseme is approximated through these shape weights; motion is left to `IAutoMovieExpression` rather than baked into the identity morph.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, the two morph targets, and that movement is out of scope with the type that owns it; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieFaceMouth {
  /** Width of the mouth: `+` a wider mouth line, `-` a narrower one. */
  width?: number;

  /** Vertical position of the whole mouth: `+` higher toward the nose. */
  height?: number;

  /** The lips themselves. */
  lips?: IAutoMovieFaceLips;
}
