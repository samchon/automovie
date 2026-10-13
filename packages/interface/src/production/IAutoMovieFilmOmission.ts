/**
 * Auditable disposition for one current shot intentionally excluded from the film. The same shot cannot also appear in the video track or be omitted twice.
 *
 * @evidence contracts/common.md#principled-implementation Shot identity and a nonblank rationale explicitly account for a current contract outside the edit, allowing assembly to prove every shot has exactly one used-or-omitted disposition.
 * @evidence contracts/common.md#clear-and-simple-design Two fields capture the omitted owner and reason without creating dummy zero-duration video placements or duplicating the unused shot's contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown shots, repeated omissions and shots also present in video are rejected rather than silently accepted as narrative accounting.
 * @evidence contracts/common.md#meaningful-documentation Gives current-shot ownership, intentional absence, nonblank audit reason and mutual exclusion with both video placement and repeated omission.
 * @author Samchon
 */
export interface IAutoMovieFilmOmission {
  /** Current shot contract intentionally absent from the edit. */
  shot: string;

  /** Auditable non-blank reason. */
  reason: string;
}
