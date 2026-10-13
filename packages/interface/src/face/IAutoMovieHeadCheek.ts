import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cheeks and cheekbones.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadCheek {
  /** Soft cheek fullness: `+` fuller (youthful), `-` gaunt. */
  fullness?: AutoMovieFaceWeight;

  /** Malar/cheekbone prominence: `+` higher/sharper (mature beauty). */
  bones?: AutoMovieFaceWeight;
}
