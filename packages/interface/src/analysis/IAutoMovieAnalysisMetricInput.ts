import type { IAutoMovieAnalysisMetricGap } from "./IAutoMovieAnalysisMetricGap";
import type { IAutoMovieAnalysisTarget } from "./IAutoMovieAnalysisTarget";
import type { IAutoMovieAnalysisWarning } from "./IAutoMovieAnalysisWarning";

/**
 * Data and callback contracts shared by the AnalysisMetricInput operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build one metric, resolving whatever target the production declared for it. Member documentation states the supplied records, units and absence meanings used by autoMovieAnalysisMetric.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record permits value/gap combinations that TypeScript cannot relate; autoMovieAnalysisMetric enforces that relation. targets and the warning sink remain the caller's records.
 * @evidence contracts/development/design.md#principled-representation key and unit identify one metric; value is finite or null, gap explains null, and status distinguishes unsupported from not-run. autoMovieAnalysisMetric rejects inconsistent value/gap pairs and compares unit strings exactly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieAnalysisMetricInput, used by autoMovieAnalysisMetric. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieAnalysisMetricInput {
  /**
   * Build one metric, resolving whatever target the production declared for it.
   *
   * A target stated in the wrong unit does not silently pass and does not
   * silently fail: it is dropped and reported as a `target-unit-mismatch`
   * warning, so the metric reads `untargeted` (which is true, nothing comparable
   * was declared) while the author is told exactly which declaration is wrong.
   * Comparing 300 lux against a target of 300 candela would be the alternative,
   * and it would clear a room nobody measured correctly.
   *
   * A metric with no value must say why. Passing a value and a gap together, or
   * neither, throws: those are the two shapes that let an absent measurement
   * masquerade as a result. A non-finite value also throws. A metric with no
   * value never carries a target, whatever was declared for its key.
   *
   * Units are compared as exact strings with no conversion, so `lx` and `lux` are
   * different units. The first target with the metric's key decides; duplicate
   * keys are refused earlier by `assertAutoMovieAnalysisTargets`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Build one metric, resolving whatever target the production declared for it. Member documentation states the supplied records, units and absence meanings used by autoMovieAnalysisMetric.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record permits value/gap combinations that TypeScript cannot relate; autoMovieAnalysisMetric enforces that relation. targets and the warning sink remain the caller's records.
   * @evidence contracts/development/design.md#principled-representation key and unit identify one metric; value is finite or null, gap explains null, and status distinguishes unsupported from not-run. autoMovieAnalysisMetric rejects inconsistent value/gap pairs and compares unit strings exactly.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieAnalysisMetricInput.IProps, used by autoMovieAnalysisMetric. Its key, unit, value, targets, warnings, gap, status members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Open metric key, such as `workplane.total.illuminance`. */
    key: string;

    /** Unit the value is produced in, compared exactly with a target's unit. */
    unit: string;

    /** Finite measured value, or `null` when the solver produced none. */
    value: number | null;

    /** Targets the production declared, already checked for shape and uniqueness. */
    targets: readonly IAutoMovieAnalysisTarget[];

    /** Caller-owned sink the resolver appends a unit-mismatch warning to. */
    warnings: IAutoMovieAnalysisWarning[];

    /** Why no value exists; required exactly when `value` is null. */
    gap?: IAutoMovieAnalysisMetricGap;

    /**
     * Which kind of absence a null value is: `unsupported` when the solver cannot
     * compute it at all, `not-run` (the default) when this study lacked an input.
     */
    status?: "unsupported" | "not-run";
  };
}
