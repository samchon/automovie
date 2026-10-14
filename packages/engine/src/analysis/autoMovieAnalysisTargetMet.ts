import { AutoMovieAnalysisComparison } from "@automovie/interface";

/**
 * Whether a measured value satisfies a target in the declared direction.
 *
 * `at-least` holds when `value >= target` and `at-most` when `value <= target`,
 * so a value exactly on the target meets it either way. Both numbers are in the
 * same unit; no conversion or tolerance is applied.
 *
 * @param value Finite measured value.
 * @param target Finite target value in the same unit.
 * @param comparison Direction the target is judged in.
 * @returns `true` for `meets`, `false` for `misses`.
 *
 * @evidence contracts/common.md#principled-implementation A closed comparison against the inclusive bound the target's direction names, which is the definition of `meets` the run contract uses, so the builder and the validator derive one verdict from one expression.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns the verdict rule that `autoMovieAnalysisMetric` applies when it builds a metric and `validateAutoMovieAnalysisRunContents` applies when it re-derives one, so the two cannot drift apart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance or unit conversion is applied and no key is special-cased; any value other than `at-least` is read as `at-most`, which is sound because both callers pass the closed `AutoMovieAnalysisComparison` union after targets have been checked.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both inclusive directions, that equality meets, the same-unit premise, and what the boolean means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One comparison with no algorithm, data structure or strategy to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar predicate that coordinates no work across requests or phases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing and owns no handle.
 * @author Samchon
 */
export const autoMovieAnalysisTargetMet: (value: number, target: number, comparison: AutoMovieAnalysisComparison) => boolean = (
  value: number,
  target: number,
  comparison: AutoMovieAnalysisComparison,
): boolean => (comparison === "at-least" ? value >= target : value <= target);
