/**
 * Affine mapping from one shot's local seconds to the independent production story clock.
 *
 * @evidence contracts/common.md#principled-implementation Story time is originSeconds plus local seconds times positive rate; finite admission and overflow checks let cross-shot events compare one physical story moment independently from edit order.
 * @evidence contracts/common.md#clear-and-simple-design Two scalars express offset and rate without embedding the film timeline or copying a story clock into each event.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted rate explicitly means one, and no story pin is inferred from cut position; unpinned or non-finite operands cannot discharge a cross-shot synchronization claim.
 * @evidence contracts/common.md#meaningful-documentation Defines origin and rate units, default rate, affine formula and independence from finished-film ordering.
 */
export interface IAutoMovieShotStoryTime {
  /**
   * Finite story-clock time in seconds at shot-local time zero.
   *
   * Two shots sharing an origin open on the same story moment however far apart the cut places them, and a shot cut later may carry the smaller origin.
   */
  originSeconds: number;

  /**
   * Story seconds elapsed per shot-local second; finite and strictly above zero. Omitted means one, so shot time and story time run together.
   *
   * A shot that stretches or compresses time still maps onto the clock: the story time of shot-local `t` is `originSeconds + t * rate`.
   */
  rate?: number;
}
