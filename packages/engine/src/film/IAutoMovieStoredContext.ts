import {
  IAutoMovieBeatEndState,
  IAutoMovieReviewNote,
  IAutoMovieScene,
  IAutoMovieScript,
  IAutoMovieShot,
} from "@automovie/interface";

/**
 * What `readSlateContext` answers for one stored-context request.
 *
 * `getScript` and `getScene` answer the slate's script or scene, `null` before
 * that stage has run; `getShot` answers the shot whose id is `shot:<beat>`, and
 * `getBeatEnd` the end state of the beat, each `null` when absent; `getNotes`
 * answers the open notes, filtered to one beat when the request names it, and
 * an empty array rather than `null` when none match. Every non-null answer is
 * the slate's own object, not a copy.
 *
 * @evidence contracts/common.md#principled-implementation A union of the slate's stored value types plus `null`, and `readSlateContext` returns exactly one member per request type, so a caller narrows by the request it sent; duplicate shot ids or beat ends throw rather than answering with the first match.
 * @evidence contracts/common.md#clear-and-simple-design One result union for the five stored requests, mirroring `IAutoMovieStoredContextRequest`, rather than a per-request result type that would add five declarations for one switch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence is `null` and an unmatched note filter is an empty list; nothing is synthesized, defaulted or compiled on demand for a stage that has not run.
 * @evidence contracts/common.md#meaningful-documentation States the producer, which member each request yields, when each answer is `null` or empty, and that answers are the slate's own objects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the lookups are linear scans answered on `readSlateContext`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answered fresh from the slate per request; nothing is cached between requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Script, scene, shot, beat-end and unfiltered note answers alias the slate's own objects, so they live as long as the slate and a caller mutating one edits the slate; only a filtered note list is a new array of the same note objects.
 * @author Samchon
 */
export type IAutoMovieStoredContext =
  | IAutoMovieScript
  | IAutoMovieScene
  | IAutoMovieShot
  | IAutoMovieReviewNote[]
  | IAutoMovieBeatEndState
  | null;
