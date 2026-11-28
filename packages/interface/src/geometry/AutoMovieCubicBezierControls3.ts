import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Read-only view of four ordered XYZ Bernstein controls for one cubic span in
 * its owning chart.
 *
 * The readonly type gives consumers a read-only view of the tuple and its
 * triples. A caller that needs a frozen publication obtains it from the
 * curve-parent context.
 */
export type AutoMovieCubicBezierControls3 = readonly [
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
];
