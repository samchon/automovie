import { AutoMovieRepaintObservationVerdict } from "@automovie/interface";

/**
 * Admit pass, fail, not-run or unsupported as one declared visual-review verdict. The diagnostic owner later requires every verdict to be pass; this predicate judges no pixels.
 *
 * @evidence contracts/common.md#principled-implementation Exact supported verdict comparisons retain unsuccessful, unperformed and unsupported observations without conflating vocabulary with acceptance.
 * @evidence contracts/common.md#clear-and-simple-design Verdict spelling and completed-sequence acceptance stay with separate simple predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-passing verdicts remain truthful metadata and a pass string supplies no independent visual judgment.
 * @evidence contracts/common.md#meaningful-documentation Prose states supported verdicts, later all-pass requirement and absent pixel observation.
 * @evidence contracts/performance.md#efficient-algorithms Four fixed exact comparisons use constant additional storage without walking media or member records.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar vocabulary check owns no playback coordinator or prior-verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains no verdict or observation record and starts no browser, file or provider task.
 */
export const productionRepaintObservationIsVerdict: (value: AutoMovieRepaintObservationVerdict) => boolean = (value: AutoMovieRepaintObservationVerdict): boolean =>
  value === "pass" ||
  value === "fail" ||
  value === "not-run" ||
  value === "unsupported";
