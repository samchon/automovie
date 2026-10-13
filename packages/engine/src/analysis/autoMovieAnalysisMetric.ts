import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisTarget,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

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
 * masquerade as a result.
 */
export const autoMovieAnalysisMetric = (props: {
  /** Open metric key. */
  key: string;
  /** Unit the value is produced in. */
  unit: string;
  /** Finite measured value, or `null` when the solver produced none. */
  value: number | null;
  /** Targets the production declared, already checked. */
  targets: readonly IAutoMovieAnalysisTarget[];
  /** Sink the resolver appends unit-mismatch warnings to. */
  warnings: IAutoMovieAnalysisWarning[];
  /** Required when `value` is null. */
  gap?: IAutoMovieAnalysisMetricGap;
  /** Which kind of nothing; defaults to `not-run`. */
  status?: "unsupported" | "not-run";
}): IAutoMovieAnalysisMetric => {
  const { key, unit, value, gap } = props;
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
  const target = props.targets.find((entry) => entry.key === key);
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
    status: satisfied(value, target.value, target.comparison)
      ? "meets"
      : "misses",
    gap: null,
  };
};

/** Whether a value satisfies a target in the declared direction. */
const satisfied = (
  value: number,
  target: number,
  comparison: IAutoMovieAnalysisTarget["comparison"],
): boolean => (comparison === "at-least" ? value >= target : value <= target);
