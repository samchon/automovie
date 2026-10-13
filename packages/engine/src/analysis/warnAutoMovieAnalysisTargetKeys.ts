import {
  IAutoMovieAnalysisTarget,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

/**
 * Report every declared target that names no metric the study reports.
 *
 * A target nobody can apply is the quietest way a report reads `meets`.
 * `autoMovieAnalysisMetric` already reports a target stated in the wrong unit
 * as a `target-unit-mismatch` warning for exactly this reason, and a mistyped
 * or hopeful key is the same fault with the same consequence: the author
 * believes a requirement is enforced, every metric is measured, no gap is
 * recorded, and the verdict comes back clean over a rule that was never
 * checked. So an inapplicable target is stated either way, here as a
 * `target-key-unknown` warning appended to `warnings` in declared order, one
 * per unmatched target.
 *
 * A target that names a metric which produced no value is **not** reported
 * here. That metric already carries its own reason and reaches the report as a
 * gap, so the requirement is visibly unanswered rather than silently dropped.
 *
 * `keys` is the whole set the study reports, which for a solver that emits more
 * than one run is the union across them: a moisture target is not unmatched
 * merely because the thermal run has no such metric.
 *
 * @evidence contracts/common.md#principled-implementation Builds a `Set` of the reported keys and appends a warning for each declared target whose key is absent, so applicability is exact string equality between target and metric keys.
 * @evidence contracts/common.md#clear-and-simple-design Shared by the daylight, envelope, acoustics and space-air analyzers, each passing its own warning sink, so the unknown-key rule and its wording live in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No metric or target key is special-cased; targets naming a metric that produced no value are deliberately left unwarned because that metric already reaches the report as a gap.
 * @evidence contracts/common.md#meaningful-documentation States why an unknown key is a warning, which neighbouring rule reports units, the exclusion for valueless metrics, that `keys` is the cross-run union, and the warning code and append order.
 * @evidence contracts/performance.md#cost-and-resources O(keys + targets) with one hashed lookup per target; the envelope analyzer calls it once per run sink with identical inputs, rebuilding the same small key set so both runs carry the warning. The set is call-local and the appended warnings belong to the caller's sink.
 */
export const warnAutoMovieAnalysisTargetKeys = (props: {
  /** Targets the production declared, already checked. */
  targets: readonly IAutoMovieAnalysisTarget[];

  /** Every metric key the study reports, across all of its runs. */
  keys: readonly string[];

  /** Sink the unmatched targets are appended to, in declared order. */
  warnings: IAutoMovieAnalysisWarning[];
}): void => {
  const reported = new Set(props.keys);
  for (const target of props.targets)
    if (!reported.has(target.key))
      props.warnings.push({
        code: "target-key-unknown",
        detail: `target for "${target.key}" names no metric this study reports; the target was ignored`,
        subject: target.key,
      });
};
