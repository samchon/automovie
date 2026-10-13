import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieWallOpening } from "../geometry/IAutoMovieWallOpening";

/** The rectangular wall panel and cut voids one boundary's own face implies. */
export interface IAutoMovieBoundaryWallCut {
  /** Panel extent along the boundary's local X, in metres. */
  width: number;
  /** Panel extent along the boundary's local Y, in metres. */
  height: number;
  /** Panel extent along the boundary's local Z, in metres. */
  depth: number;
  /** World position of the panel's own centre. */
  origin: IAutoMovieVector3;
  /** World rotation of the panel, taken from the boundary's face. */
  rotation: IAutoMovieQuaternion;
  /** Kernel voids, each keyed by the architectural opening that declared it. */
  openings: IAutoMovieWallOpening[];
}
