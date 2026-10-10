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
 */
export function createHumanFaceClearanceCheck(
  owner: string,
  label: string,
  measure: () => IAutoMovieHumanConstructionClearanceReading[],
): IHumanConstructionCheck {
  let readings: IAutoMovieHumanConstructionClearanceReading[] | undefined;
  const read = (): IAutoMovieHumanConstructionClearanceReading[] =>
    (readings ??= measure());
  const millimetres = (value: number | null): string =>
    value === null ? "unknown" : (value * 1000).toFixed(4) + " mm";
  return {
    owner,
    read,
    assert: () => {
      const refused = read().filter((reading) => reading.refused);
      if (refused.length === 0) return;
      const first = refused[0];
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
