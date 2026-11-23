/**
 * The worst reading of one audit check over a motion: how bad, when and
 * where.
 *
 * `value` is always "larger is worse" in the check's own unit (metres for
 * every check of the audit), and zero when nothing was read, so a caller
 * compares it with one limit whatever the check.
 */
export interface IAutoMovieMotionHumanAuditMeasure {
  /** The worst reading, metres; zero when the check read nothing. */
  value: number;

  /** The film second of the worst reading; zero when the check read nothing. */
  seconds: number;

  /** What the worst reading was read on (bones, a foot, an action); `none` when the check read nothing. */
  where: string;
}
