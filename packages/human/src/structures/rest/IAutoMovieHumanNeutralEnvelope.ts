import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/** Independent convex-envelope observables in a declared local plane.
 */
export interface IAutoMovieHumanNeutralEnvelope extends IAutoMovieHumanSurfaceEnvelope {
  /** Extent-midpoint displacement along the plane's breadth direction, mm. */
  breadthOffsetMm: number;

  /** Extent-midpoint displacement along projected anterior, mm. */
  anteriorOffsetMm: number;
}
