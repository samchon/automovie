/**
 * A seated cyclist rises against the pedals and returns to the saddle while
 * the same bicycle continues along its authored course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the moving prop, its contacts, lift in metres and the ordered events in seconds.
 * @evidence contracts/development/design.md#principled-representation Separate time boundaries establish the saddle-free window while the prop owns the pedal, grip and saddle frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanBicycleEffort consumes these parameters and delegates the seated pose to HumanRide.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bicycle and both crank contacts remain supplied by the scene. The lift is an authored performance choice.
 */
export interface IAutoMovieMotionHumanBicycleEffort {
  /** Subject id of the moving bicycle. */
  on: string;

  /** Saddle point id on the bicycle. */
  seat: string;

  /** Left and right pedal point ids on the bicycle. */
  feet: { left: string; right: string };

  /** Left and right bar grip point ids on the bicycle. */
  hands: { left: string; right: string };

  /** Total action length in seconds. */
  seconds: number;

  /** Second the pelvis begins to leave the saddle, after grip acquisition. */
  seatOff: number;

  /** Second the pelvis first reaches the authored standing clearance. */
  up: number;

  /** Second the rider begins to lower out of the standing effort. */
  lower: number;

  /** Second the pelvis returns to the saddle, at or before the end. */
  seatOn: number;

  /** Saddle clearance at full standing effort, in metres. */
  lift: number;
}
