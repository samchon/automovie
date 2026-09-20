import { IAutoMovieAnalysisTarget, IAutoMovieAnalysisWarning } from "@automovie/interface";

/**
 * Report every declared target that names no metric the study reports.
 *
 * A target nobody can apply is the quietest way a report reads `meets`. The
 * unit mismatch above is already refused out loud for exactly this reason, and
 * a mistyped or hopeful key is the same fault with the same consequence: the
 * author believes a requirement is enforced, every metric is measured, no gap
 * is recorded, and the verdict comes back clean over a rule that was never
 * checked. So an inapplicable target is stated either way.
 *
 * A target that names a metric which produced no value is **not** reported
 * here. That metric already carries its own reason and reaches the report as a
 * gap, so the requirement is visibly unanswered rather than silently dropped.
 *
 * `keys` is the whole set the study reports, which for a solver that emits more
 * than one run is the union across them: a moisture target is not unmatched
 * merely because the thermal run has no such metric.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `warnAutoMovieAnalysisTargetKeys` exposes declared thresholds that no reported metric actually checks.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The pass compares target keys with the union of emitted metric keys and appends stable unmatched-target warnings.
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
