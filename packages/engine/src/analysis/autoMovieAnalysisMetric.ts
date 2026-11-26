import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  type IAutoMovieAnalysisMetricInput,
  IAutoMovieAnalysisTarget,
} from "@automovie/interface";

import { autoMovieAnalysisTargetMet } from "./internal/autoMovieAnalysisTargetMet";

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
 */
export function autoMovieAnalysisMetric(
  props: IAutoMovieAnalysisMetricInput.IProps,
): IAutoMovieAnalysisMetric {
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
}
