/**
 * Why a surface target of the numerical body request has no binding yet.
 *
 * - `missing-landmark`: a fixed anatomical point the survey definition needs is not registered on the source skin.
 * - `missing-rule`: the landmarks exist, but no measurement rule reads the quantity on the shaped skin.
 * - `missing-tissue-boundary`: the quantity is a tissue thickness or volume the one connected exterior has no boundary for.
 *
 * @evidence contracts/common.md#principled-implementation Three closed reason categories distinguish absent registered points, absent measurement rules and unresolved internal tissue boundaries.
 * @evidence contracts/common.md#clear-and-simple-design One reason union separates the missing dependency from the gap record's path and explanatory detail.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These authored gap categories describe current support; the type itself performs no inspection proving absence on a supplied source.
 * @evidence contracts/common.md#meaningful-documentation Each literal's prose explains which dependency prevents a surface request from being answered.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Gap-reason typing evaluates no landmark search or tissue-boundary reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reason vocabulary stores no completed availability scan to share across sources.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three reason literals own no source registration, geometry buffers or instrument task.
 * @author Samchon
 */
export type AutoMovieHumanBodyExteriorGapReason =
  | "missing-landmark"
  | "missing-rule"
  | "missing-tissue-boundary";
