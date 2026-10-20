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
 * @evidence contracts/common.md#clear-and-simple-design One function shared by every analyzer, writing into the caller's sink, so a multi-run solver collects the warnings once and copies them to each run it emits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No metric or target key is special-cased; targets naming a metric that produced no value are deliberately left unwarned because that metric already reaches the report as a gap.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why an inapplicable target must be stated, the warning code and order, the deliberate exclusion of gapped metrics, and that `keys` is the union across a study's runs.
 * @evidence contracts/performance.md#efficient-algorithms O(K + T) for K reported keys and T targets: one set build and one hashed lookup per target instead of a scan of the keys per target.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call checks one study's targets once; the envelope analyzer, the only multi-run caller, now calls it once and copies the result into both runs instead of repeating it per run.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The key set is call-local and released on return; the appended warnings, at most one per target, belong to the caller's sink.
 */
export const warnAutoMovieAnalysisTargetKeys: (props: {
  targets: readonly IAutoMovieAnalysisTarget[];
  keys: readonly string[];
  warnings: IAutoMovieAnalysisWarning[];
}) => void = (props: {
  /** Targets the production declared, already checked. */
  targets: readonly IAutoMovieAnalysisTarget[];

  /** Every metric key the study reports, across all of its runs. */
  keys: readonly string[];

  /** Caller-owned sink the unmatched targets are appended to, in declared order. */
  warnings: IAutoMovieAnalysisWarning[];
}): void => {
  const reported: Set<string> = new Set<string>(props.keys);
  for (const target of props.targets)
    if (!reported.has(target.key))
      props.warnings.push({
        code: "target-key-unknown",
        detail: `target for "${target.key}" names no metric this study reports; the target was ignored`,
        subject: target.key,
      });
};
