/**
 * One point of a code-authored 2D construction profile, in metres.
 *
 * The consumer maps the axes: extrusion and region faces place `x` and `y` in
 * local XY with depth along Z, revolution reads `x` as radius and `y` as height
 * around local Y, and sweep and loft read `x` along the path frame's right and
 * `y` along its up. Each builder refuses a non-finite coordinate by the point's
 * label. The shape matches the interface's `IAutoMoviePlanarPoint`, so
 * `AutoMovieEnginePlanarRegion.failure` validates profile rings directly.
 */
export interface IAutoMovieProfilePoint {
  /** First profile coordinate in metres, mapped by the consuming builder. */
  x: number;

  /** Second profile coordinate in metres, mapped by the consuming builder. */
  y: number;
}
