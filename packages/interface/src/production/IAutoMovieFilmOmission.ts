/**
 * Auditable disposition for one current shot intentionally excluded from the film. The same shot cannot also appear in the video track or be omitted twice.
 *
 * @evidence contracts/development/design.md#principled-representation Shot identity and a nonblank rationale record an intended exclusion in a supplied timeline. Engine edit fingerprinting includes these rows, but the retired production assembler no longer proves complete used-or-omitted shot accounting.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields capture the omitted owner and reason without creating dummy zero-duration video placements or duplicating the unused shot's contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Known shot identity, unique omission and exclusion from video remain host premises. The record computes no zero-duration substitute and its presence alone does not establish narrative accounting.
 * @evidence contracts/development/common.md#meaningful-documentation Gives current-shot ownership, intentional absence, nonblank audit reason and mutual exclusion with both video placement and repeated omission.
 */
export interface IAutoMovieFilmOmission {
  /** Current shot contract intentionally absent from the edit. */
  shot: string;

  /** Auditable non-blank reason. */
  reason: string;
}
