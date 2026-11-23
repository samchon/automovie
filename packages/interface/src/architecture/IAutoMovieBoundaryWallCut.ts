import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieWallOpening } from "../geometry/IAutoMovieWallOpening";

/**
 * The rectangular wall panel and cut voids one boundary's own face implies.
 *
 * Produced by `builtBoundaryWallCut`. The panel is the axis-aligned bounding
 * rectangle of the face outline in local XY, centred on its plane. Each void
 * bounds `outlineHull`'s straight arc-enclosing ring, which can remain
 * non-convex, measured from the panel's lower-left corner. A profile-less
 * opening contributes no void.
 */
export interface IAutoMovieBoundaryWallCut {
  /** Panel extent along the boundary's local X, in metres. */
  width: number;

  /** Panel extent along the boundary's local Y, in metres. */
  height: number;

  /** Panel extent along local Z: the face thickness, in metres. */
  depth: number;

  /** World position of the panel's own centre, on the face plane. */
  origin: IAutoMovieVector3;

  /** World rotation of the panel, the boundary face's own rotation object. */
  rotation: IAutoMovieQuaternion;

  /** Kernel voids, each keyed by the architectural opening that declared it. */
  openings: IAutoMovieWallOpening[];
}
