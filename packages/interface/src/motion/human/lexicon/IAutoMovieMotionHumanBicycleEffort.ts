/**
 * A seated cyclist rises against the pedals and returns to the saddle while the
 * same bicycle continues along its authored course.
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

  /**
   * Total action length in seconds; it holds `seatOff`, `up`, `lower` and
   * `seatOn` in order. No natural value is defined: choose it for the beat
   * (provisional, missing).
   */
  duration: number;

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
