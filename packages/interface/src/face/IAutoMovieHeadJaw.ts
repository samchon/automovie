import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Jaw and chin traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, omitted meaning unchanged. The chin is flattened into this group
 * rather than nested. `flattenHead` projects the fields onto `jawWidth`,
 * `jawDrop`, `chinLength`, `chinWidth` and `chinProject`.
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
