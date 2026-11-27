import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";

/**
 * The one reader of the frame a body's base rests on: the ground, a prop it
 * sits or stands on (a saddle, a cart's bed, a deck), or a performer's region
 * it is borne on, with that frame's velocity and acceleration at a second.
 * Every consumer reads it here: a presented weapon aimed in the support's
 * frame, a launch inheriting the support's velocity, the rider's inertial load,
 * a borne person.
 *
 * The support is the bearing contact the action is entered on
 * (`IAutoMovieMotionHumanEntryState.supports`): the seat or the feet, not a
 * gripping hand, the first one on a prop or a person, the ground when every one
 * is on the ground. The velocity and the acceleration are the central
 * differences of the support's origin at the engine's plan-time step
 * (`AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep()`). A performer's region is read only at and
 * before the second evaluated (contract), so its differences are backward ones
 * over the same step.
 */
export namespace IAutoMovieMotionHumanSupportFrame {
  /** The support's frame at a second. */
  export interface IFrame {
    /** What the base rests on. */
    support: IAutoMovieMotionHumanContactWindow.Support;

    /** Its origin, world metres. */
    position: IAutoMovieVector3;

    /** Its rotation to the world. */
    rotation: IAutoMovieQuaternion;

    /** Its origin's velocity, m/s. */
    velocity: IAutoMovieVector3;

    /** Its origin's acceleration, m/s². */
    acceleration: IAutoMovieVector3;
  }
}
