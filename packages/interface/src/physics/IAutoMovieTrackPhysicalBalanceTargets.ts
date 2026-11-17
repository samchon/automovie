/**
 * Sampled root-lowering request accompanying coherent fitted pose/twist targets.
 *
 * @evidence contracts/development/design.md#principled-representation Root lowering is interpolated over the same remaining causal interval as fitted poses; its signed derivative uses that interval's duration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface trackPhysicalBalanceTargets returns the lowering component while its caller retains the interval plan and motor tracking ownership.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Revision replanning preserves completed history rather than restarting a full interval, and the request does not claim actual root displacement.
 * @evidence contracts/development/common.md#meaningful-documentation Names positive-down lowering and its signed time derivative from the fitted interval.
 */
export namespace IAutoMovieTrackPhysicalBalanceTargets {
  /**
   * Balance owns a coherent support posture independently of optional Cartesian endpoint actuators. Fitted interval poses and twists travel together; actual stationary stance takes priority over an incompatible authored-root posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names positive-down lowering and its signed time derivative from the fitted interval.
   * @evidence contracts/development/design.md#principled-representation rootDrop is metres and rootDropVelocity m/s on the same local clock as coherent fitted pose/twist targets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface trackPhysicalBalanceTargets returns the lowering component while its caller retains the interval plan and motor tracking ownership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts These values are motor intent; they do not claim the measured root already moved or that a Cartesian endpoint actuator exists.
   */
  export type IResult = {
    /** Interpolated positive-down root lowering request in metres at the current local time. */
    rootDrop: number;
    /** Signed change in lowering per second across the plan's remaining interval, in m/s. */
    rootDropVelocity: number;
  };
}
