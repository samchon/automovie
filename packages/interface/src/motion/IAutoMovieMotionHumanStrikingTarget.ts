import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The relations every striking law reads from its entry state and its target:
 * which side leads, the line to the target, the feet as placed, and how a foot
 * steps along the line or pivots on its ball.
 */
export namespace IAutoMovieMotionHumanStrikingTarget {
  /** The line a virtual opponent stands on. */
  export interface IStance {
    /**
     * The stance centre a range is measured from: midway between the ankles, on
     * the floor.
     */
    centre: IAutoMovieVector3;

    /** The horizontal unit direction toward the virtual opponent. */
    forward: IAutoMovieVector3;
  }
}
