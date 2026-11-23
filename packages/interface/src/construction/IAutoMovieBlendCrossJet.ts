import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Point and two derivatives across a blend column in world millimetres. */
export interface IAutoMovieBlendCrossJet {
  /** Boundary or interior column point in world millimetres. */
  point: AutoMovieVector3Tuple;

  /** First cross derivative in millimetres per unit dimensionless blend share. */
  first: AutoMovieVector3Tuple;

  /** Second cross derivative in millimetres per squared blend share. */
  second: AutoMovieVector3Tuple;
}
