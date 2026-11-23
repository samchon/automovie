/**
 * Contracts of `MotionTrajectoryPartition`: an integrated state's error partition.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the partition's blocks and the units each keeps.
 * @evidence contracts/development/design.md#principled-representation Block lengths partition one state vector so each block's error is measured in its own unit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The motion integrators' tolerances read it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A partition only; it certifies no error bound.
 */
export namespace IAutoMovieMotionTrajectoryPartition {
  /**
   * Numeric interval ownership, with all times in seconds.
   *
   * Describes exact-end lookup, strict rejected-leaf bisection and explicit release.
   * Contains only numerical time boundaries of one finite forward integration interval, never physical state or admission verdicts.
   * Shooting owns the object and the adaptive stepper alone consumes end/split; clear releases the mesh on every exit.
   * No trusted success flag, estimated shape or unconstrained output storage is exposed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionTrajectoryPartition.IPartition: Numeric interval ownership, with all times in seconds.
   * @evidence contracts/development/design.md#principled-representation One record of end, split, clear.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `MotionTrajectoryPartition` fills it and the enclosing IAutoMovieMotionTrajectoryPartition contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `MotionTrajectoryPartition`.
   */
  export interface IPartition {
    /**
     * Return an existing leaf's exact end, or register the controller's new proposal.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionTrajectoryPartition.IPartition.end: Return an existing leaf's exact end, or register the controller's new proposal.
     */
    end(start: number, proposed: number): number;

    /**
     * Bisect the rejected start leaf until its duration meets the controller's finite positive maximumStep, or once when omitted. False means an invalid reduction or exhausted strict midpoint.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionTrajectoryPartition.IPartition.split: Bisect the rejected start leaf until its duration meets the controller's finite positive maximumStep, or once when omitted.
     */
    split(start: number, maximumStep?: number): boolean;

    /**
     * Release all boundaries after the shooting operation, including failure.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionTrajectoryPartition.IPartition.clear: Release all boundaries after the shooting operation, including failure.
     */
    clear(): void;
  }
}
