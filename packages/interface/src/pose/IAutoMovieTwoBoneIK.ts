/**
 * The law-of-cosines solution `solveTwoBoneIK` returns for a two-segment chain
 * reaching a point at a given distance from its root.
 *
 * Both angles are in degrees and say nothing about the bend plane, which the
 * caller chooses; `twoBoneChainArticulation` reads only `lift`.
 */
export interface IAutoMovieTwoBoneIK {
  /**
   * Interior angle at the mid joint (knee or elbow) in degrees: `180` is
   * straight, `0` fully folded, smaller is more bent.
   */
  bend: number;

  /**
   * Angle in degrees between the upper segment and the straight root-to-goal
   * line, so the tip lands on the goal; `0` when the clamped distance is zero.
   */
  lift: number;

  /**
   * True when the goal was nearer than `|upper - lower|` or farther than `upper
   * + lower`, and the angles describe the clamped distance instead.
   */
  clamped: boolean;
}
