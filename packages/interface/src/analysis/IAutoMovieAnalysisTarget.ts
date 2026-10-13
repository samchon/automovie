import { AutoMovieAnalysisComparison } from "./AutoMovieAnalysisComparison";

/**
 * One numeric target the production declares for one metric.
 *
 * The unit is declared beside the value on purpose. A target of `300` against a
 * metric measured in lux and a target of `300` against a metric measured in
 * candela are different requirements, and a contract that carried only the
 * number would let one silently clear the other.
 *
 * A target only ever narrows a verdict; it never widens one. One that cannot be
 * applied, because its unit disagrees with the metric or its key names nothing
 * the study reports, is dropped and said out loud as a run warning rather than
 * quietly satisfied. That is the difference between a rule that was checked and
 * a rule nobody could check, and only the first of them may leave a report
 * reading `meets`.
 */
export interface IAutoMovieAnalysisTarget {
  /** Metric key this target applies to. */
  key: string;

  /** Unit symbol the target is stated in, such as `lx`, `s`, `dB`. */
  unit: string;

  /** Finite target value in {@link unit}. */
  value: number;

  /** Whether the metric must reach the value or stay under it. */
  comparison: AutoMovieAnalysisComparison;
}
