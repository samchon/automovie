import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanWebCurve; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanWebCurve {
  /**
   * The curve argument of AutoMovieHumanWebCurve.sampled. A curve read by its
   * depth along a direction from its start: the point where it first reaches a
   * depth, so a web's rows are level sets of that depth. A curve that leaves
   * its start across the direction (a saddle's own column) reaches its first
   * depths at their square root. Past its ends it runs on along its end
   * tangents.
   */
  export type SampledCurve = (u: number) => AutoMovieVector3Tuple;

  /**
   * Result of AutoMovieHumanWebCurve.sampled. A curve read by its depth along a
   * direction from its start: the point where it first reaches a depth, so a
   * web's rows are level sets of that depth. A curve that leaves its start
   * across the direction (a saddle's own column) reaches its first depths at
   * their square root. Past its ends it runs on along its end tangents.
   */
  export type SampledResult = (depth: number) => AutoMovieVector3Tuple;
}
