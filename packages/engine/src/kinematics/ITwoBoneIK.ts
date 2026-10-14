/**
 * The law-of-cosines solution `solveTwoBoneIK` returns for a two-segment chain
 * reaching a point at a given distance from its root.
 *
 * Both angles are in degrees and say nothing about the bend plane, which the
 * caller chooses; `twoBoneChainArticulation` reads only `lift`.
 *
 * @evidence contracts/common.md#principled-implementation The interior angles at the mid joint and root follow the law of cosines on the reachable triangle, subject to binary64 precision; solveTwoBoneIK owns common-unit rescaling and refuses unrepresentable relative side products before constructing this record.
 * @evidence contracts/common.md#clear-and-simple-design Two scalar angles and a flag, the plane-free part of a two-bone solve, so arm and leg callers orient the chain in their own bend plane.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreachable goal is clamped to the reachable shell and reported with `clamped` rather than returning `NaN` or silently presenting the clamped pose as a hit.
 * @evidence contracts/common.md#meaningful-documentation States the producer and consumer, the unit, the meaning and range of each angle including the straight and folded ends, the zero-distance convention, and what `clamped` reports.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two arccosines per solve, computed in constant time by `solveTwoBoneIK`, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Three values per law-of-cosines call, recomputed per distance because each call asks about a different reach.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two angles and a reach flag, held by the caller only while it orients the chain.
 * @author Samchon
 */
export interface ITwoBoneIK {
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
   * True when the goal was nearer than `|upper - lower|` or farther than
   * `upper + lower`, and the angles describe the clamped distance instead.
   */
  clamped: boolean;
}
