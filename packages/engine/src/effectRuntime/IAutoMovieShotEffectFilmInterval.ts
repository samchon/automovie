/**
 * One shot-owned effect interval projected onto the film clock.
 *
 * `projectProductionShotEffectFilmIntervals` emits one per film occurrence of
 * a shot cue that overlaps its segment, trimmed to that segment. The builder
 * supplies these intervals to `materializeProductionFilmEffects` only to prove
 * that one world zone has one effect owner at every realized film frame; they
 * are not substituted for film-owned runtime effects. Frames are half-open:
 * `startFrame` is owned and `endFrame` is not.
 *
 * @evidence contracts/development/design.md#principled-representation A half-open integer frame interval `[startFrame, endFrame)` on the film-global clock, so two intervals on one zone conflict exactly when each starts before the other ends, and touching intervals do not conflict.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the cue and shot ids only to name the conflicting owner in a refusal, plus the zone and frames the conflict test reads; the stream itself is not carried because the film writer never samples it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The materializer refuses a blank id, a negative or fractional frame and an empty interval instead of clamping it, so an interval with no meaning cannot silently pass the ownership proof.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and consumer, that one occurrence per overlapping segment is emitted and trimmed, that intervals prove single ownership rather than replace film runtimes, and the half-open frame convention of each bound.
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
