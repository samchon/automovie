import { IAutoMovieVector3 } from "@automovie/interface";

/** One further space a run stops at, placed on the route that reaches it. */
export interface IAutoMovieConnectorLandingAt {
  /** Logical space served at this stop. */
  space: string;
  /** Arc-length fraction of the route, as authored. */
  at: number;
  /** World position of that point of the route. */
  position: IAutoMovieVector3;
}
