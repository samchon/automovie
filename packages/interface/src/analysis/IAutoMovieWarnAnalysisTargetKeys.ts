import type { IAutoMovieAnalysisTarget } from "./IAutoMovieAnalysisTarget";
import type { IAutoMovieAnalysisWarning } from "./IAutoMovieAnalysisWarning";

/**
 * Data and callback contracts shared by the WarnAnalysisTargetKeys operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Report every declared target that names no metric the study reports. Member documentation states the supplied records, units and absence meanings used by warnAutoMovieAnalysisTargetKeys.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts String keys retain the open metric vocabulary; missing measurements remain their metric's own gaps rather than being reclassified as unknown keys.
 * @evidence contracts/development/design.md#principled-representation targets are compared against the complete reported key set across the study's runs, and warnings is the caller-owned append sink.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieWarnAnalysisTargetKeys, used by warnAutoMovieAnalysisTargetKeys. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieWarnAnalysisTargetKeys {
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
   * @evidence contracts/development/common.md#meaningful-documentation Report every declared target that names no metric the study reports. Member documentation states the supplied records, units and absence meanings used by warnAutoMovieAnalysisTargetKeys.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts String keys retain the open metric vocabulary; missing measurements remain their metric's own gaps rather than being reclassified as unknown keys.
   * @evidence contracts/development/design.md#principled-representation targets are compared against the complete reported key set across the study's runs, and warnings is the caller-owned append sink.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieWarnAnalysisTargetKeys.IProps, used by warnAutoMovieAnalysisTargetKeys. Its targets, keys, warnings members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Targets the production declared, already checked. */
    targets: readonly IAutoMovieAnalysisTarget[];

    /** Every metric key the study reports, across all of its runs. */
    keys: readonly string[];

    /** Caller-owned sink the unmatched targets are appended to, in declared order. */
    warnings: IAutoMovieAnalysisWarning[];
  };
}
