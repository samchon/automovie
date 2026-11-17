/**
 * The worst reading of one audit check over a motion: how bad, when and
 * where.
 *
 * `value` is always "larger is worse" in the check's own unit (metres for
 * every check of the audit), and zero when nothing was read, so a caller
 * compares it with one limit whatever the check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sign convention, the unit and the empty reading.
 * @evidence contracts/development/design.md#principled-representation One scalar with its instant and its place, the least a reader needs to find the defect in the motion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by the audit report and by its tests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member, cast or index signature.
 */
export interface IAutoMovieMotionHumanAuditMeasure {
  /** The worst reading, metres; zero when the check read nothing. */
  value: number;

  /** The film second of the worst reading; zero when the check read nothing. */
  seconds: number;

  /** What the worst reading was read on (bones, a foot, an action); `none` when the check read nothing. */
  where: string;
}
