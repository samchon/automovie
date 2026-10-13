/** Where one shot sits on the production story clock. */
export interface IAutoMovieShotStoryTime {
  /**
   * Finite story-clock time in seconds at shot-local time zero.
   *
   * Two shots sharing an origin open on the same story moment however far apart
   * the cut places them, and a shot cut later may carry the smaller origin.
   */
  originSeconds: number;

  /**
   * Story seconds elapsed per shot-local second; finite and strictly above
   * zero. Omitted means one, so shot time and story time run together.
   *
   * A shot that stretches or compresses time still maps onto the clock: the
   * story time of shot-local `t` is `originSeconds + t * rate`.
   */
  rate?: number;
}
