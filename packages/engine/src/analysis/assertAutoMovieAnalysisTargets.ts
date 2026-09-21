import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/**
 * Check the targets a production declares before any solver reads them.
 *
 * Targets are the one input that can turn a correct measurement into a wrong
 * verdict, so they are refused at the door rather than negotiated later: a
 * blank key, a blank unit, a non-finite value, an unknown direction, or two
 * targets fighting over the same key are all authoring mistakes with no sane
 * interpretation.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `assertAutoMovieAnalysisTargets` fails before solving when a target is blank, non-finite, directionless, or duplicated by key.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The assertion validates target identity, unit, threshold, comparison direction, and uniqueness in declaration order.
 */
export const assertAutoMovieAnalysisTargets = (
  targets: readonly IAutoMovieAnalysisTarget[],
): void => {
  const seen = new Set<string>();
  for (const target of targets) {
    if (target.key.trim().length === 0)
      throw new Error("an analysis target must name a non-blank metric key");
    if (target.unit.trim().length === 0)
      throw new Error(
        `analysis target "${target.key}" must state the unit its value is in`,
      );
    if (!Number.isFinite(target.value))
      throw new Error(
        `analysis target "${target.key}" must be a finite value, but was ${target.value}`,
      );
    if (target.comparison !== "at-least" && target.comparison !== "at-most")
      throw new Error(
        `analysis target "${target.key}" must compare "at-least" or "at-most", but was ${String(target.comparison)}`,
      );
    if (seen.has(target.key))
      throw new Error(
        `analysis target "${target.key}" is declared more than once`,
      );
    seen.add(target.key);
  }
};
