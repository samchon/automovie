import { IAutoMovieHalfSpacePlane } from "@automovie/interface";

/**
 * One convex blocker an analysis ray may be stopped by.
 *
 * Both a read-only neighbouring mass and a building's own shading solid are
 * this shape, which is what lets one occlusion routine serve both without
 * either becoming the other. What a solid is _not_ is ownership: the caller
 * decides which list a solid came from, and the analysis never returns a
 * context mass as building geometry.
 */
export interface IAutoMovieAnalysisSolid {
  /** Stable identity of the blocker within its own list. */
  id: string;
  /** Half-spaces whose intersection is the solid; at least four. */
  planes: readonly IAutoMovieHalfSpacePlane[];
}
