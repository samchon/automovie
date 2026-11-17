import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the SuperposeMinimumJerk operations. */
export namespace IAutoMovieSuperposeMinimumJerk {
  /** One unit. */
  export interface IUnit {
    /** Displacement the unit adds, metres. */
    displacement: IAutoMovieVector3;

    /** Start, seconds. */
    start: number;

    /** Duration, seconds; positive. */
    duration: number;
  }

  /** The moved point at an instant. */
  export interface IState {
    /** Position, metres. */
    position: IAutoMovieVector3;

    /** Velocity, metres per second. */
    velocity: IAutoMovieVector3;

    /** Acceleration, metres per second squared. */
    acceleration: IAutoMovieVector3;
  }
}
