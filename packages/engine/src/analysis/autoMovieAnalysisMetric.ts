import { IAutoMovieAnalysisMetric, IAutoMovieAnalysisMetricGap, IAutoMovieAnalysisTarget, IAutoMovieAnalysisWarning } from "@automovie/interface";

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
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `autoMovieAnalysisMetric` keeps absent measurements explicit and refuses contradictory value-gap combinations.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The builder resolves a same-unit target, derives its verdict, reports unit mismatches, and requires one reason for every missing value.
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-unsupported-state `autoMovieAnalysisMetric` records an unavailable solver capability as `unsupported` with a required gap reason instead of fabricating a measured value.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-unsupported-state The metric builder preserves `unsupported` as an explicit no-value outcome with its own reason and remedy.
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-classification-independence `autoMovieAnalysisMetric` keeps measurement availability, threshold verdict, and warning severity in separate fields rather than collapsing them into one status.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-classification-orthogonality The metric record independently represents solver availability, target comparison, and declaration warnings for the same check.
 * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-automated-finding-boundary `autoMovieAnalysisMetric` labels a solver-produced value or explicit gap as an automated metric result, never as a human approval.
 * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-automated-finding-result The metric builder records value, unit, target verdict, or non-execution reason as machine output without manufacturing a judgment record.
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
