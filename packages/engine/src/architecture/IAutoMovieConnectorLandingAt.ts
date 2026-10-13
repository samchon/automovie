import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One further space a run stops at, placed on the route that reaches it.
 *
 * Produced by `builtConnectorGeometry` in the connector's authored `landings`
 * order. The authored fraction is scaled by the route's total 3D length and
 * the point is interpolated on the polyline segment that length falls in.
 * Validation keeps `at` strictly between `0` and `1` and the space distinct
 * from both ends.
 *
 * @author Samchon
 */
export interface IAutoMovieConnectorLandingAt {
  /** Logical space served at this stop. */
  space: string;

  /** Arc-length fraction of the route, as authored. */
  at: number;

  /** World position of that point of the route. */
  position: IAutoMovieVector3;
}
