import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/**
 * The declared targets as they enter an analyzer's settings text.
 *
 * Each target is copied to exactly its four contract fields, `key`, `unit`,
 * `value` and `comparison`, in that order and in list order. Extra runtime properties and original property order are ignored; changes to covered JSON values change the settings text, while signed zeros share an encoding and a digest is not a collision-free identity proof.
 *
 * @param targets Targets the study declares, already checked.
 * @returns New records holding only the four contract fields.
 *
 * @evidence contracts/common.md#principled-implementation A field-by-field copy in fixed order turns a structurally typed record into the canonical shape `JSON.stringify` then serializes deterministically, because JSON keeps insertion order and drops nothing else from these four fields.
 * @evidence contracts/common.md#clear-and-simple-design The four analyzers each digest their targets, so the projection lives once here instead of four identical inline maps that could drift apart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is renamed, rounded or defaulted, and no analyzer or key is special-cased; the copy covers exactly the fields the target contract declares.
 * @evidence contracts/common.md#meaningful-documentation The documentation names the copied fields and their order, why the projection keeps the digest canonical, and what it ignores.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One map over the T targets allocating one four-field record each, with no algorithm or strategy to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each analyzer calls it once per study while building that study's settings text; no other phase needs the projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns T new records that the caller serializes into the settings text and then drops; this function retains nothing.
 * @author Samchon
 */
export const autoMovieAnalysisSettingsTargets: (
  targets: readonly IAutoMovieAnalysisTarget[],
) => IAutoMovieAnalysisTarget[] = (
  targets: readonly IAutoMovieAnalysisTarget[],
): IAutoMovieAnalysisTarget[] =>
  targets.map(
    (target: IAutoMovieAnalysisTarget): IAutoMovieAnalysisTarget => ({
      key: target.key,
      unit: target.unit,
      value: target.value,
      comparison: target.comparison,
    }),
  );
