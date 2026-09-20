import { IAutoMovieShotStoryTime } from "@automovie/interface";

/**
 * Map one shot-local time in seconds onto the production story clock.
 *
 * The map is affine, so a shot that stretches or compresses time still lands on
 * the same clock as one that does not, and the inverse question — which shot
 * covers a given story moment — stays answerable.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-absolute-relative-time autoMovieStoryTime applies the shot's origin and rate to preserve a distinct absolute story time independent of edit placement.
 * @evidence requirements/story/story-clock-and-state.md#story-presentation-chronology Maps a shot-local presentation instant through its explicit story origin and rate without treating edit placement as chronology.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-representation autoMovieStoryTime represents the story instant explicitly as `originSeconds + localSeconds × rate`, independent of edit order.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-chronology-presentation Keeps the affine story-time mapping independent of the shot's eventual presentation position.
 */
export const autoMovieStoryTime = (
  pin: IAutoMovieShotStoryTime,
  localSeconds: number,
): number => pin.originSeconds + localSeconds * (pin.rate ?? 1);
