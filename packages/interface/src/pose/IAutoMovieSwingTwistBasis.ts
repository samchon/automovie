import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A joint's unit axes and the two axes of the great circles through its rest
 * direction.
 */
export namespace IAutoMovieSwingTwistBasis {
  /**
   * A joint's unit axes and the two axes of the great circles through its rest
   * direction.
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
