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
