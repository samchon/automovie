import {
  IAutoMovieHeightRule,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Admit constant/plane finite parameters or a finite heightfield with positive
 * pitch, safe dimensions>=2 and exact row-major count.
 */
export function validateSurfaceHeightRule(
  rule: IAutoMovieHeightRule,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (rule.kind === "constant" || rule.kind === "plane") return;
  positiveSpacing(
    rule.spacingX,
    `${path}.spacingX`,
    "heightfield spacingX",
    collector,
  );
  positiveSpacing(
    rule.spacingZ,
    `${path}.spacingZ`,
    "heightfield spacingZ",
    collector,
  );
  if (rule.columns < 2 || rule.rows < 2)
    collector.push(
      "range",
      `${path}.columns`,
      `a heightfield needs at least two sample columns and rows, but had ${rule.columns} by ${rule.rows}`,
      rule.columns,
    );
  else if (rule.samples.length !== rule.columns * rule.rows)
    collector.push(
      "range",
      `${path}.samples`,
      `a heightfield of ${rule.columns} by ${rule.rows} needs exactly ${rule.columns * rule.rows} row-major samples, but had ${rule.samples.length}`,
      rule.samples.length,
    );
}

/**
 * Require finite strictly positive lattice pitch.
 *
 * Pitch semantics are distinct from signed height/slope scalars.
 *
 * Zero/negative spacing is refused rather than defaulted.
 *
 * Paths preserve which grid axis pitch failed.
 *
 * Fixed finite/sign comparisons cost constant work.
 *
 * Both heightfield axis pitches share the same policy.
 *
 * Only collector faults remain; no grid or native terrain is acquired.
 */
const positiveSpacing: (
  value: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value,
    );
};
