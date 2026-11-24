import {
  IAutoMovieHeightRule,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Admit constant/plane finite parameters or a finite heightfield with positive
 * pitch, safe dimensions>=2 and exact row-major count.
 */
export const validateSurfaceHeightRule: (
  rule: IAutoMovieHeightRule,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  rule: IAutoMovieHeightRule,
  path: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (rule.kind === "constant") {
    finiteHeight(rule.value, `${path}.value`, "constant height", collector);
    return;
  }
  if (rule.kind === "plane") {
    finiteHeight(
      rule.originHeight,
      `${path}.originHeight`,
      "plane origin height",
      collector,
    );
    finiteHeight(rule.slopeX, `${path}.slopeX`, "plane slopeX", collector);
    finiteHeight(rule.slopeZ, `${path}.slopeZ`, "plane slopeZ", collector);
    return;
  }
  finiteHeight(
    rule.originX,
    `${path}.originX`,
    "heightfield originX",
    collector,
  );
  finiteHeight(
    rule.originZ,
    `${path}.originZ`,
    "heightfield originZ",
    collector,
  );
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
  if (
    Number.isSafeInteger(rule.columns) === false ||
    Number.isSafeInteger(rule.rows) === false ||
    rule.columns < 2 ||
    rule.rows < 2
  )
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
  for (let i: number = 0; i < rule.samples.length; ++i) {
    const sample: number = rule.samples[i]!;
    finiteHeight(
      sample,
      `${path}.samples[${i}]`,
      "heightfield sample",
      collector,
    );
  }
};

/**
 * Report a nonfinite ground parameter at its supplied path.
 *
 * One owner keeps constant/plane/lattice diagnostics aligned.
 *
 * Finite signed heights/slopes are allowed rather than constrained positive.
 *
 * The original value and field-specific label are preserved.
 *
 * One finite test and failure text take bounded work.
 *
 * All height-rule scalar fields reuse this predicate.
 *
 * Only caller-owned diagnostics remain, without a height cache.
 */
const finiteHeight: (
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
  if (Number.isFinite(value) === false)
    collector.push(
      "range",
      path,
      `${label} must be finite, but was ${value}`,
      value,
    );
};

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
  if (Number.isFinite(value) === false || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value,
    );
};
