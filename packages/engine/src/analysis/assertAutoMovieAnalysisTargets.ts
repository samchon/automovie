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
 * Throws an `Error` naming the first offending target in list order. Whether a
 * key names a metric the study reports is not checked here;
 * `warnAutoMovieAnalysisTargetKeys` reports that after the metrics exist.
 *
 * @param targets Targets one study declares, in authored order.
 *
 * @evidence contracts/common.md#principled-implementation One pass rejects a blank key or unit, a non-finite value, a comparison outside the two-member union and a repeated key, which are exactly the conditions under which `autoMovieAnalysisMetric` could not pick one comparable target for a metric.
 * @evidence contracts/common.md#clear-and-simple-design Every analyzer calls this one guard from its request validator, so target rules are stated once; applicability to reported keys is left to `warnAutoMovieAnalysisTargetKeys` because it needs the metrics this check runs before.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It checks `comparison` at runtime although its type is a closed union because targets arrive from authored data, and no key, unit or analyzer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why targets are refused early, the five refused faults, the first-in-list-order throw, and which function checks key applicability instead.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the T targets with a `Set` of seen keys, so duplicate detection is O(T) instead of a pairwise O(T²) scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each analyzer calls it once per study on that study's own targets; no verdict outlives the call to be shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The seen-key set grows to at most T entries and is released when the call returns or throws; nothing is retained.
 * @author Samchon
 */
export const assertAutoMovieAnalysisTargets: (targets: readonly IAutoMovieAnalysisTarget[]) => void = (
  targets: readonly IAutoMovieAnalysisTarget[],
): void => {
  const seen: Set<string> = new Set<string>();
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
