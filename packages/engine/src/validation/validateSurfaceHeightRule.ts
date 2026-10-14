import { IAutoMovieHeightRule } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * Admit constant/plane finite parameters or a finite heightfield with positive pitch, safe dimensions>=2 and exact row-major count.
 *
 * @evidence contracts/common.md#principled-implementation Admit constant/plane finite parameters or a finite heightfield with positive pitch, safe dimensions>=2 and exact row-major count.
 * @evidence contracts/common.md#clear-and-simple-design The closed variant switch aligns metadata with height-rule query fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown kinds report an error; scalar finiteness does not guarantee representable extreme products.
 * @evidence contracts/common.md#meaningful-documentation Lattice origins/pitch/dimensions/sample paths and null-free variant semantics are stated.
 * @evidence contracts/performance.md#efficient-algorithms S lattice samples require O(S) finite checks, with fixed other fields.
 * @evidence contracts/performance.md#reuse-equivalent-work finiteHeight and positiveSpacing share scalar checks across variants.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only collector rows remain, while samples stay borrowed without a terrain resource.
 */
export const validateSurfaceHeightRule: (
  rule: IAutoMovieHeightRule,
  path: string,
  collector: ViolationCollector,
) => void = (
  rule: IAutoMovieHeightRule,
  path: string,
  collector: ViolationCollector,
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
  // Runtime junk past the closed union, checked for the same reason the surface
  // kind is: the height query would read the unknown rule as a lattice and
  // dereference fields it has no reason to carry.
  if (rule.kind !== "heightfield") {
    collector.push(
      "type",
      `${path}.kind`,
      `unknown surface height rule "${String((rule as { kind: unknown }).kind)}"`,
      (rule as { kind: unknown }).kind,
    );
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
  collector: ViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
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
  collector: ViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Number.isFinite(value) === false || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value,
    );
};
