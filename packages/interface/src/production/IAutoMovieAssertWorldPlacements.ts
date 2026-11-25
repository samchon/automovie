import type { IAutoMovieWorldBlock } from "./IAutoMovieWorldBlock";
import type { IAutoMovieWorldLandmark } from "./IAutoMovieWorldLandmark";
import type { IAutoMovieWorldRoute } from "./IAutoMovieWorldRoute";
import type { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/** Data and callback contracts shared by the AssertWorldPlacements operations. */
export namespace IAutoMovieAssertWorldPlacements {
  /**
   * Reject material world-layout contradictions before shot construction.
   *
   * Blocks may touch but not overlap; every base must sit on a declared
   * surface; routes must clear block footprints; every landmark must lie on a
   * walkable surface or within its declared radius of a route.
   *
   * Positions are world metres with Y up, and blocks are unrotated boxes. A
   * base sits on a surface when all four footprint corners lie in or on its XZ
   * polygon, by {@link worldSurfaceContains}, at the surface height within 1e-6
   * m, and no notch of the polygon cuts the footprint. Route clearance is
   * judged in plan: each segment must miss every block footprint widened by
   * half the route's formation width, whatever the block's height. A landmark
   * is on walkable ground when a walkable surface contains its plan position,
   * edge included, and is by a route when its plan distance to some segment is
   * at most its radius plus half that route's formation width. The checks run
   * in that order and the first contradiction throws an `Error` naming it;
   * later ones are not reported.
   */
  export type IInput = {
    /** Static world masses, as axis-aligned world boxes. */
    blocks: readonly IAutoMovieWorldBlock[];

    /** Terrain and floor surfaces that may support a block or hold a landmark. */
    surfaces: readonly IAutoMovieWorldSurface[];

    /**
     * Routes whose segments, widened by half their formation width, must clear
     * every block.
     */
    routes: readonly IAutoMovieWorldRoute[];

    /**
     * Points of interest that must be reachable from walkable ground or a
     * route.
     */
    landmarks: readonly IAutoMovieWorldLandmark[];
  };
}
