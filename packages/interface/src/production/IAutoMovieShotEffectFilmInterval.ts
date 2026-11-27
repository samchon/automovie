/**
 * One shot-owned effect interval projected onto the film clock.
 *
 * `projectProductionShotEffectFilmIntervals` emits one per film occurrence of a
 * shot cue that overlaps its segment, trimmed to that segment. The builder
 * supplies these intervals to `materializeProductionFilmEffects` only to prove
 * that one world zone has one effect owner at every realized film frame; they
 * are not substituted for film-owned runtime effects. Frames are half-open:
 * `startFrame` is owned and `endFrame` is not.
 */
export interface IAutoMovieShotEffectFilmInterval {
  /** Shot-owned cue id, unique inside its shot. */
  cue: string;

  /** Id of the shot that owns the cue. */
  shot: string;

  /** World effect-zone id the cue activates. */
  zone: string;

  /** First film-global frame the cue owns, inclusive. */
  startFrame: number;

  /** First film-global frame after the cue, exclusive. */
  endFrame: number;
}
