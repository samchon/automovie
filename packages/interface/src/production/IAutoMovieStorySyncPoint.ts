/**
 * One addressed shot event with its realized local and mapped story times.
 *
 * @evidence contracts/common.md#principled-implementation The synchronization evaluator retains the exact shot/event operand and finite realized local seconds, then applies the owning shot's affine story pin to obtain story seconds.
 * @evidence contracts/common.md#clear-and-simple-design Nullable local and story fields distinguish absent realization from absent pin or mapped overflow without inventing a second event identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable operands are retained in declared order rather than skipped; a null time cannot become zero and accidentally satisfy simultaneity.
 * @evidence contracts/common.md#meaningful-documentation Defines exact operand identities, local versus story-second units and missing-realization, missing-pin or overflow null meaning.
 * @author Samchon
 */
export interface IAutoMovieStorySyncPoint {
  /** Owning shot id. */
  shot: string;

  /** Exact event id. */
  event: string;

  /**
   * Supplied realized shot-local time in seconds, or null when absent or nonfinite. The production adapter selects the first matching event id in the current supplied realization.
   */
  localSeconds: number | null;

  /**
   * Story-clock time in seconds, or null when the local time or pin is unavailable or the affine result is nonfinite, including overflow.
   */
  storySeconds: number | null;
}
