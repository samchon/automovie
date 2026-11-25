import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Checkpointable displacement correction for a dynamic segment returning to
 * authored motion with continuous pose and velocity.
 *
 * Tick is the preceding native tick; duration is seconds. Child corrections are
 * parent-local, while a root's correction is in world coordinates relative to
 * its authored path. advancePhysicalOwnership creates and advances these
 * records alongside native state; controller checkpoints retain the correction
 * required to continue the same return. The record is a return trajectory, not
 * a body snapshot or force command. completed retains the endpoint through its
 * path check, then the next step removes the record.
 */
export interface IAutoMoviePhysicalHandoff {
  /** Exact integer native tick immediately before switching ownership. */
  tick: number;

  /** Positive authored return duration, seconds. */
  duration: number;

  /**
   * Parent-local inherited anchor error, or root displacement from the authored
   * path, metres.
   */
  position: IAutoMovieVector3;

  /**
   * Derivative of the inherited anchor displacement in m/s, parent-local for a
   * child and world-relative for a root.
   */
  velocity: IAutoMovieVector3;

  /**
   * Rotation-vector displacement from the authored orientation, radians in the
   * parent frame or world frame for a root.
   */
  rotation: IAutoMovieVector3;

  /**
   * Derivative of the rotation-vector displacement in rad/s in the same
   * correction frame; distinct from the segment's angular velocity.
   */
  angularVelocity: IAutoMovieVector3;

  /**
   * True only after reaching the return endpoint; omitted while active. Retains
   * the final candidate through validation before removal on the next step.
   */
  completed?: boolean;
}
