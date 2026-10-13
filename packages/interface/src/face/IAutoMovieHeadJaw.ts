import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Jaw and chin.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadJaw {
  /** Gonial/jaw width: `+` wider/squarer, `-` softer/tapered (feminine). */
  width?: AutoMovieFaceWeight;

  /** Jaw drop / lower-face length at the angle. */
  drop?: AutoMovieFaceWeight;

  /** Chin vertical length: `+` longer, `-` shorter (feminine/childlike). */
  chinLength?: AutoMovieFaceWeight;

  /** Chin width: `+` broader, `-` narrower/pointed. */
  chinWidth?: AutoMovieFaceWeight;

  /** Chin forward projection: `+` prominent, `-` recessive (East-Asian). */
  chinProjection?: AutoMovieFaceWeight;
}
