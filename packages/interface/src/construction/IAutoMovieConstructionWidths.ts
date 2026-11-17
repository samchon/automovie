import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Data and callback contracts shared by the ConstructionWidths operations. */
export namespace IAutoMovieConstructionWidths {
  /**
   * The retained trace and surfaces from which fold/curvature laws read their knots.
   *
   * @evidence contracts/development/design.md#principled-representation Connects each traced chart point/tangent to the actual part/host jets and the merge/diff orientation convention.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One context shares the existing curve and sides across both width-law builders.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not validate curve closure, uniform parameters, nondegenerate jets or face indices; it relies on the trace owner's admitted output.
   * @evidence contracts/development/common.md#meaningful-documentation Names part versus host atlas and the diff flag's inward kept-wall meaning.
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
