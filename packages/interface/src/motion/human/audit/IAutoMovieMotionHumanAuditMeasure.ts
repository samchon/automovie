/**
 * The worst reading of one audit check over a motion: how bad, when and
 * where.
 *
 * `value` is always "larger is worse" in the check's own unit, and zero when
 * nothing was read, so a caller compares it with one limit whatever the check.
 * The unit is the one the check's owner states: metres for `tangle`, `floor`,
 * `slip`, `lift`, `jump`, `reversal`, `balance`, `afloat`, `statics` and
 * `partner`; metres per second for `speed`, `skate` and `loose`; degrees for
 * `range`, `unloaded` and `turn`.
 */
export interface IAutoMovieMotionHumanAuditMeasure {
  /** The worst reading in the check's own unit; zero when the check read nothing. */
  value: number;

  /** The film second of the worst reading; zero when the check read nothing. */
  seconds: number;

  /** What the worst reading was read on (bones, a foot, an action); `none` when the check read nothing. */
  where: string;
}
