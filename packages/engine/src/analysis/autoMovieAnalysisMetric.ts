import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisTarget,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

import { autoMovieAnalysisTargetMet } from "./autoMovieAnalysisTargetMet";

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
 * @evidence contracts/common.md#principled-implementation Encodes the metric shape rules directly: a null value requires a gap and defaults to `not-run`, a value must be finite and gap-free, and a same-key target in the same unit decides `meets` or `misses` through `autoMovieAnalysisTargetMet`, the predicate the run validator re-derives verdicts with.
 * @evidence contracts/common.md#clear-and-simple-design One builder shared by every analyzer owns target resolution, so each solver states only key, unit, value and gap; the verdict expression lives in `autoMovieAnalysisTargetMet` because the validator needs the same rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A unit-mismatched target is dropped with a `target-unit-mismatch` warning instead of being compared or converted, and no metric key, unit or analyzer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the unit-mismatch outcome and why, the three throwing shapes, that a valueless metric carries no target, exact-string unit comparison, and which target decides; each property states its role, the `not-run` default and when a gap is required.
 * @evidence contracts/performance.md#efficient-algorithms One linear `find` over the T declared targets per metric, so resolving a run of M metrics costs O(M·T); a key index would cost a map per study for runs that resolve at most eleven metrics (the daylight run) against a handful of targets.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call resolves one metric of one run against that study's own targets; there is no completed or in-flight result another call could reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a new metric record and appends at most one warning to the caller-owned array, retaining nothing itself.
 */
export const autoMovieAnalysisMetric: (props: {
  key: string;
  unit: string;
  value: number | null;
  targets: readonly IAutoMovieAnalysisTarget[];
  warnings: IAutoMovieAnalysisWarning[];
  gap?: IAutoMovieAnalysisMetricGap;
  status?: "unsupported" | "not-run";
}) => IAutoMovieAnalysisMetric = (props: {
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
}): IAutoMovieAnalysisMetric => {
  const key: string = props.key;
  const unit: string = props.unit;
  const value: number | null = props.value;
  const gap: IAutoMovieAnalysisMetricGap | undefined = props.gap;
  if (value === null) {
    if (gap === undefined)
      throw new Error(
        `analysis metric "${key}" produced no value and must state why`,
      );
    return {
      key,
      unit,
      value: null,
      target: null,
      comparison: null,
      status: props.status ?? "not-run",
      gap,
    };
  }
  if (gap !== undefined)
    throw new Error(
      `analysis metric "${key}" carries both a value and a gap; a measured metric has no gap`,
    );
  if (!Number.isFinite(value))
    throw new Error(
      `analysis metric "${key}" must be a finite value, but was ${value}`,
    );
  const target: IAutoMovieAnalysisTarget | undefined = props.targets.find(
    (entry: IAutoMovieAnalysisTarget): boolean => entry.key === key,
  );
  if (target === undefined)
    return {
      key,
      unit,
      value,
      target: null,
      comparison: null,
      status: "untargeted",
      gap: null,
    };
  if (target.unit !== unit) {
    props.warnings.push({
      code: "target-unit-mismatch",
      detail: `target for "${key}" is declared in ${target.unit} while the metric is measured in ${unit}; the target was ignored`,
      subject: key,
    });
    return {
      key,
      unit,
      value,
      target: null,
      comparison: null,
      status: "untargeted",
      gap: null,
    };
  }
  return {
    key,
    unit,
    value,
    target: target.value,
    comparison: target.comparison,
    status: autoMovieAnalysisTargetMet(value, target.value, target.comparison)
      ? "meets"
      : "misses",
    gap: null,
  };
};
