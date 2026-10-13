import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Mouth and lip traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, omitted meaning unchanged. `smile` is a resting identity shape,
 * not an expression. `flattenHead` projects `lipFullness`, `upperLipHeight`
 * and `lowerLipHeight` onto `lipFull`, `upperLipH` and `lowerLipH`, and the
 * other fields onto same-stem names (`mouthWidth`, `cupidsBow`, `philtrum`,
 * `mouthHeight`, `mouthSmile`).
 *
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
