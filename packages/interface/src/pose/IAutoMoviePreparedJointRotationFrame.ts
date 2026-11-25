import type { IAutoMovieJointRotationFrame } from "./IAutoMovieJointRotationFrame";
import type { IAutoMovieSwingTwistRegion } from "./IAutoMovieSwingTwistRegion";

/**
 * A joint frame whose swing region was built where the joint was prepared
 * (`swingTwistRange.prepare`), for the constraint it is read under.
 */
export type IAutoMoviePreparedJointRotationFrame =
  IAutoMovieJointRotationFrame & {
    /** The swing region of that constraint. */
    readonly region: IAutoMovieSwingTwistRegion;
  };
