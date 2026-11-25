/**
 * Contracts of `MotionTrajectoryPartition`: an integrated state's error
 * partition.
 */
export namespace IAutoMovieMotionTrajectoryPartition {
  /**
   * Numeric interval ownership, with all times in seconds.
   *
   * Describes exact-end lookup, strict rejected-leaf bisection and explicit
   * release. Contains only numerical time boundaries of one finite forward
   * integration interval, never physical state or admission verdicts. Shooting
   * owns the object and the adaptive stepper alone consumes end/split; clear
   * releases the mesh on every exit. No trusted success flag, estimated shape
   * or unconstrained output storage is exposed.
   */
  export interface IPartition {
    /**
     * Return an existing leaf's exact end, or register the controller's new
     * proposal.
     */
    end(start: number, proposed: number): number;

    /**
     * Bisect the rejected start leaf until its duration meets the controller's
     * finite positive maximumStep, or once when omitted. False means an invalid
     * reduction or exhausted strict midpoint.
     */
    split(start: number, maximumStep?: number): boolean;

    /** Release all boundaries after the shooting operation, including failure. */
    clear(): void;
  }
}
