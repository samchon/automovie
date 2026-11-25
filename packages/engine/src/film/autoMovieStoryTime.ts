import { IAutoMovieShotStoryTime } from "@automovie/interface";

/**
 * Map one shot-local time in seconds onto the production story clock,
 * `originSeconds + localSeconds * rate`, with an omitted rate meaning `1`.
 *
 * The map is affine, so a shot that stretches or compresses time still lands on
 * the same clock as one that does not. Nothing is validated here: a non-finite
 * input, or an overflow, yields a non-finite story time.
 * `evaluateAutoMovieStorySync` reports a non-finite result as an unresolved
 * operand.
 */
export const autoMovieStoryTime = (
  pin: IAutoMovieShotStoryTime,
  localSeconds: number,
): number => pin.originSeconds + localSeconds * (pin.rate ?? 1);
