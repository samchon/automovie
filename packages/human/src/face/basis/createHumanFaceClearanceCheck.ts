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
 * @evidence contracts/common.md#principled-implementation The verdict is computed from the reported readings, which makes the admission a function of what it publishes.
 * @evidence contracts/common.md#clear-and-simple-design One adapter gives every measuring owner the same memoised check shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reading is dropped or reordered to change a verdict, and a measuring error propagates as the owner's refusal.
 * @evidence contracts/common.md#meaningful-documentation States memoisation, the refusal rule and what the cause text contains.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Adapts readings; defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Formats metres as millimetres in a message and converts nothing else.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The measuring owners own the boundaries they read.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical admission transport.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Applies each reading's own verdict.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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
