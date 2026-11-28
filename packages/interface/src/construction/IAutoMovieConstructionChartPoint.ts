/**
 * Address on an authored face chart, using physical station in metres and phase
 * in radians. The face's owner resolves that address to geometry.
 */
export interface IAutoMovieConstructionChartPoint {
  /** Physical station of the address along the face, in metres. */
  station: number;

  /** Phase in radians around the face at this station. */
  phase: number;
}
