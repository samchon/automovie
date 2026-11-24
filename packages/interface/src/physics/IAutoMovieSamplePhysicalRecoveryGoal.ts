import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieStepPlanner } from "./IAutoMovieStepPlanner";

/**
 * Recovery-swing sampling inputs and requested world support position/velocity.
 */
export namespace IAutoMovieSamplePhysicalRecoveryGoal {
  /**
   * One recovery swing plus the authored vertical baseline at the requested clock.
   *
   * Swing start/end and seconds share local seconds; point is world metres, velocity world m/s and height nonnegative metres. samplePhysicalRecoveryGoal borrows input and uses the swing's X/Z endpoints with the authored point.y and velocity.y; it allocates the sampled point and velocity. The caller supplies a finite positive swing duration and admitted placements. Progress clamps to [0,1]; horizontal authored point/velocity components do not drive this trajectory.
   */
  export type IInput = {
    /** Existing support swing, with explicit start and end. */
    swing: IAutoMovieStepPlanner.IStep;

    /** Authored world endpoint in metres at seconds; only Y supplies the vertical baseline. */
    point: IAutoMovieVector3;

    /** Authored world endpoint velocity in m/s at seconds; only Y is added to the swing derivative. */
    velocity: IAutoMovieVector3;

    /** Declared peak clearance, metres. */
    height: number;

    /** Requested local seconds. */
    seconds: number;
  };

  /**
   * Requested support point and analytic velocity on a recovery swing.
   *
   * point is world metres and velocity world m/s; X/Z follow quintic endpoint interpolation, Y adds a clearance h 16 (p (1 - p))^2, at rest at both ends, to the authored vertical baseline. samplePhysicalRecoveryGoal allocates both vectors; neither is a measurement of a native body or a landing receipt. Outside the swing the horizontal rate and added clearance rate are zero, while the authored vertical velocity remains. The caller owns admission of the swing and baseline.
   */
  export type IResult = {
    /** Requested world support endpoint in metres, combining swing X/Z and authored Y plus clearance. */
    point: IAutoMovieVector3;

    /** Requested world support velocity in m/s from the same trajectory and clock; not a measured native velocity. */
    velocity: IAutoMovieVector3;

    /** The swing's own acceleration in m/s^2 from the same trajectory and clock, the authored baseline's left out; zero outside the swing. */
    acceleration: IAutoMovieVector3;
  };
}
