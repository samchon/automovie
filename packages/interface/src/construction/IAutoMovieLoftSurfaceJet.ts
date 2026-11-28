import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * World surface point and all partial derivatives through total order two.
 * Station is the chain's physical millimetre coordinate and phase is in
 * radians. Loft jet readers include placement, lift and admitted relief before
 * returning the vectors.
 */
export interface IAutoMovieLoftSurfaceJet {
  /** Surface position in world millimetres. */
  p: AutoMovieVector3Tuple;

  /**
   * First station partial in world millimetres per millimetre of physical
   * station.
   */
  s: AutoMovieVector3Tuple;

  /** First phase partial in world millimetres per radian. */
  t: AutoMovieVector3Tuple;

  /** Second station partial in inverse millimetres. */
  ss: AutoMovieVector3Tuple;

  /** Mixed station and phase partial in inverse radians. */
  st: AutoMovieVector3Tuple;

  /** Second phase partial in world millimetres per squared radian. */
  tt: AutoMovieVector3Tuple;
}
