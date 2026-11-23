import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/**
 * The joint's frame: its axes and its rest frame.
 */
export interface IAutoMovieJointRotationFrame {
  /** The joint's clinical axes. */
  axes: IAutoMovieJointAxes;

  /** The rest frame its clinical angles are lifted by. */
  frame?: IAutoMovieRestFrame | undefined;
}
