import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/**
 *
 * Check the targets a production declares before any solver reads them.
 *
 * Targets are the one input that can turn a correct measurement into a wrong
 * verdict, so they are refused at the door rather than negotiated later: a
 * blank key, a blank unit, a non-finite value, an unknown direction, or two
 * targets fighting over the same key are all authoring mistakes with no sane
 * interpretation.
 *
 * Throws an `Error` naming the first offending target in list order. Whether a
 * key names a metric the study reports is not checked here;
 * `warnAutoMovieAnalysisTargetKeys` reports that after the metrics exist.
 *
 * @evidence contracts/common.md#principled-implementation One pass rejects a blank key or unit, a non-finite value, an unknown comparison and a repeated key, which are the conditions under which a target's verdict would be ambiguous.
 * @evidence contracts/common.md#clear-and-simple-design Shared by all four analyzers, so every domain refuses the same target faults with the same wording.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Checks `comparison` at runtime although its type is a closed union, because targets arrive from authored data; key applicability is deferred to the warning pass rather than guessed here.
 * @evidence contracts/common.md#meaningful-documentation States the five refused faults, why they are refused before solving, that the first fault throws, and where unknown keys are reported instead.
 * @evidence contracts/performance.md#cost-and-resources One pass over targets with a `Set` of seen keys, so cost is linear in the target count. Each analyzer calls it once per study on that study's own targets, and no verdict outlives the call. Its key set lives only for the duration of the call.
 * @author Samchon
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
