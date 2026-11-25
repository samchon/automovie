import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";
import type { IAutoMovieSwingTwistRegion } from "./IAutoMovieSwingTwistRegion";

/** The joint's frame: its axes and its rest frame. */
export interface IAutoMovieJointRotationFrame {
  /** The joint's clinical axes. */
  axes: IAutoMovieJointAxes;

  /** The rest frame its clinical angles are lifted by. */
  frame?: IAutoMovieRestFrame | undefined;

  /**
   * The swing region of the constraint the joint is read under, built where the
   * joint is prepared; absent on a frame that is not prepared.
   */
  readonly region?: IAutoMovieSwingTwistRegion | undefined;
}
