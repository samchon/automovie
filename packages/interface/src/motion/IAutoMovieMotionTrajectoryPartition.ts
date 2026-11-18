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
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `MotionTrajectoryPartition` supplies end and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `MotionTrajectoryPartition`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `MotionTrajectoryPartition` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `MotionTrajectoryPartition` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `MotionTrajectoryPartition` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `MotionTrajectoryPartition` owns what it retains and releases.
     */
    end(start: number, proposed: number): number;

    /**
     * Bisect the rejected start leaf until its duration meets the controller's finite positive maximumStep, or once when omitted. False means an invalid reduction or exhausted strict midpoint.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionTrajectoryPartition.IPartition.split: Bisect the rejected start leaf until its duration meets the controller's finite positive maximumStep, or once when omitted.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `MotionTrajectoryPartition` supplies split and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `MotionTrajectoryPartition`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `MotionTrajectoryPartition` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `MotionTrajectoryPartition` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `MotionTrajectoryPartition` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `MotionTrajectoryPartition` owns what it retains and releases.
     */
    split(start: number, maximumStep?: number): boolean;

    /**
     * Release all boundaries after the shooting operation, including failure.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionTrajectoryPartition.IPartition.clear: Release all boundaries after the shooting operation, including failure.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; `MotionTrajectoryPartition` supplies clear and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; the decomposition belongs to `MotionTrajectoryPartition`.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constant is implemented by this signature; `MotionTrajectoryPartition` keeps every admission check.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm; `MotionTrajectoryPartition` owns its cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache; `MotionTrajectoryPartition` owns what it shares between calls.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires nothing; `MotionTrajectoryPartition` owns what it retains and releases.
     */
    clear(): void;
  }
}
