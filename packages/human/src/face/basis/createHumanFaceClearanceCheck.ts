import type { IHumanConstructionCheck } from "../../common/basis/IHumanConstructionCheck";
import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";

/**
 * Turn one owner's measured relations into its deferred admission check.
 *
 * The relations are measured once, when admission first asks, and the same
 * records serve both the verdict and the report. The check refuses exactly
 * when a reading is refused, and its cause names the first refused relation
 * with its numbers and the count of the others, so the report and the refusal
 * cannot disagree. `label` is the owner's sentence stem, kept so existing
 * consumers of the cause text still recognise the condition.
 *
 * @evidence contracts/common.md#principled-implementation A stage-owned measure callback supplies the actual relation records; refusal reads their refused flags and reports the first record's metric or unavailable cause. Current pose/generated/lining callers close over that stage's completed geometry.
 * @evidence contracts/common.md#clear-and-simple-design One lazy read closure serves both the deferred assert and construction report, keeping physical measurement with the owner that supplies it rather than reproducing its geometry rule here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared owner label formats diagnostics only; no relation is exempted by label or expected numbers. Null distances remain unknown and thrown measurements propagate without a fabricated accepted result.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes deferred measurement from admission and explains shared readings, first refusal and remaining count; metre values are rendered as millimetres only for the cause text.
 * @evidence contracts/performance.md#efficient-algorithms The first read pays the supplied measurement cost; each assertion scans R records and allocates the refused subset, O(R). Formatting reads only the first refusal, without rerunning a spatial query.
 * @evidence contracts/performance.md#reuse-equivalent-work The same completed reading array is memoized for assertion/report on one immutable stage. A new stage makes a new check; a throwing measurement assigns no cache, so later reads may retry that callback.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One check retains its callback and at most R completed readings until the construction stage/result is released. Readings are shared mutable references by API, so callers must not rewrite their verdicts; no external task is acquired.
 */
export function createHumanFaceClearanceCheck(
  owner: string,
  label: string,
  measure: () => IAutoMovieHumanConstructionClearanceReading[],
): IHumanConstructionCheck {
  let readings: IAutoMovieHumanConstructionClearanceReading[] | undefined;
  const read: () => IAutoMovieHumanConstructionClearanceReading[] =
    (): IAutoMovieHumanConstructionClearanceReading[] =>
      (readings ??= measure());
  const millimetres: (value: number | null) => string = (
    value: number | null,
  ): string => (value === null ? "unknown" : (value * 1000).toFixed(4) + " mm");
  return {
    owner,
    read,
    assert: (): void => {
      const refused: IAutoMovieHumanConstructionClearanceReading[] =
        read().filter(
          (reading: IAutoMovieHumanConstructionClearanceReading): boolean =>
            reading.refused,
        );
      if (refused.length === 0) return;
      const first: IAutoMovieHumanConstructionClearanceReading = refused[0];
      throw new Error(
        label +
          ": " +
          first.subject +
          " against " +
          first.against +
          (first.unavailable === null
            ? " (minimum signed " +
              millimetres(first.minimumSignedMetres) +
              ", " +
              first.insideVertices +
              "/" +
              first.vertices +
              " vertices inside, " +
              first.boundaryVertices +
              " on an open rim, " +
              (first.crossings ?? 0) +
              " crossings)"
            : " (unavailable: " + first.unavailable + ")") +
          (refused.length === 1
            ? ""
            : "; " + (refused.length - 1) + " more refused relations"),
      );
    },
  };
}
