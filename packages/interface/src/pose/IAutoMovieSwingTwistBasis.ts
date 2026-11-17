import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the SwingTwistBasis operations. */
export namespace IAutoMovieSwingTwistBasis {
  /**
   * A joint's unit axes and the two axes of the great circles through its
   * rest direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each axis and the circles' two axes.
   * @evidence contracts/development/design.md#principled-representation The clinical axes with the plane the circles lie in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five axes, all read by the reading, the region and the projection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint is named.
   */
  export interface IBasis {
    /** The limb's rest direction, the twist axis. */
    u: IAutoMovieVector3;

    /** The flexion axis. */
    f: IAutoMovieVector3;

    /** The abduction axis. */
    a: IAutoMovieVector3;

    /** The first axis of the great circles, the flexion axis again. */
    e1: IAutoMovieVector3;

    /** The second axis of the great circles, the rest direction turned by `e1`. */
    e2: IAutoMovieVector3;
  }
}
