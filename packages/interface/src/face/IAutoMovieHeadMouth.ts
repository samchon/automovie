import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Mouth and lips.
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
