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
  width?: number;

  /** Lip fullness (both lips): `+` fuller (feminine), `-` thinner. */
  lipFullness?: number;

  /** Upper-lip vermilion height. */
  upperLipHeight?: number;

  /** Lower-lip vermilion height. */
  lowerLipHeight?: number;

  /** Cupid's-bow definition. */
  cupidsBow?: number;

  /** Philtrum volume. */
  philtrum?: number;

  /** Vertical mouth position: `+` higher, `-` lower. */
  height?: number;

  /** Resting corner lift (slight smile): `+` up, `-` down. */
  smile?: number;
}
