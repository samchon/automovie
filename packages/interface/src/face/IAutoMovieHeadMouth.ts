import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Mouth and lip traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, omitted meaning unchanged. `smile` is a resting identity shape,
 * not an expression. `flattenHead` projects `lipFullness`, `upperLipHeight`
 * and `lowerLipHeight` onto `lipFull`, `upperLipH` and `lowerLipH`, and the
 * other fields onto same-stem names (`mouthWidth`, `cupidsBow`, `philtrum`,
 * `mouthHeight`, `mouthSmile`).
 *
 * @evidence contracts/common.md#principled-implementation Eight leaves mapped by `flattenHead`, abbreviating the three lip fields to `lipFull`, `upperLipH` and `lowerLipH` and prefixing width, height and smile with `mouth`, each applied as a template delta.
 * @evidence contracts/common.md#clear-and-simple-design Mouth placement, lip volume and lip detail share one record because head groups do not nest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `smile` is a resting corner lift that belongs to identity; an animated smile belongs to `IAutoMovieExpression`, and nothing combines the two.
 * @evidence contracts/common.md#meaningful-documentation Adds the owning document, the range, neutral omission, the abbreviated morph names and the identity-not-expression meaning of smile; members give direction where the vocabulary fixes it.
 * @author Samchon
 */
export interface IAutoMovieHeadMouth {
  /** Mouth width: `+` wider, `-` narrower. */
  width?: AutoMovieFaceWeight;

  /** Lip fullness (both lips): `+` fuller (feminine), `-` thinner. */
  lipFullness?: AutoMovieFaceWeight;

  /** Upper-lip vermilion height. */
  upperLipHeight?: AutoMovieFaceWeight;

  /** Lower-lip vermilion height. */
  lowerLipHeight?: AutoMovieFaceWeight;

  /** Cupid's-bow definition. */
  cupidsBow?: AutoMovieFaceWeight;

  /** Philtrum volume. */
  philtrum?: AutoMovieFaceWeight;

  /** Vertical mouth position: `+` higher, `-` lower. */
  height?: AutoMovieFaceWeight;

  /** Resting corner lift (slight smile): `+` up, `-` down. */
  smile?: AutoMovieFaceWeight;
}
