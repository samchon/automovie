/**
 * Sampled root-lowering request accompanying coherent fitted pose/twist
 * targets.
 */
export namespace IAutoMovieTrackPhysicalBalanceTargets {
  /**
   * Balance owns a coherent support posture independently of optional Cartesian
   * endpoint actuators. Fitted interval poses and twists travel together;
   * actual stationary stance takes priority over an incompatible authored-root
   * posture.
   */
  export type IResult = {
    /**
     * Interpolated positive-down root lowering request in metres at the current
     * local time.
     */
    rootDrop: number;
    /**
     * Signed change in lowering per second across the plan's remaining
     * interval, in m/s.
     */
    rootDropVelocity: number;
  };
}
