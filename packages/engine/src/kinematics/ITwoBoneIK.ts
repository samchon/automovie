/** The analytic solution for a two-bone chain reaching a goal. */
export interface ITwoBoneIK {
  /**
   * Interior angle at the mid joint (knee / elbow), degrees. `180` = straight,
   * smaller = more bent.
   */
  bend: number;
  /**
   * Angle to lift the upper segment off the straight root→goal line, degrees,
   * so the tip lands on the goal.
   */
  lift: number;
  /** True when the goal was unreachable and the distance was clamped. */
  clamped: boolean;
}
