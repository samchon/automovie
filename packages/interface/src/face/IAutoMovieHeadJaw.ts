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
  width?: number;

  /** Jaw drop / lower-face length at the angle. */
  drop?: number;

  /** Chin vertical length: `+` longer, `-` shorter (feminine/childlike). */
  chinLength?: number;

  /** Chin width: `+` broader, `-` narrower/pointed. */
  chinWidth?: number;

  /** Chin forward projection: `+` prominent, `-` recessive (East-Asian). */
  chinProjection?: number;
}
