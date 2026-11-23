import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Data and callback contracts shared by the ConstructionWidths operations. */
export namespace IAutoMovieConstructionWidths {
  /**
   * The retained trace and surfaces from which fold/curvature laws read their
   * knots.
   */
  export interface ITraced {
    /** The traced curve. */
    curve: IAutoMovieSolidIntersection.ICurve;

    /** The part's surface. */
    part: IAutoMovieSolidSurface;

    /** The host's faces. */
    host: IAutoMovieSolidAtlas;

    /** Whether the join is a diff, whose kept part wall faces into the part. */
    diff: boolean;
  }
}
