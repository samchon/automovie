import type { IAutoMovieProductionViseme } from "@automovie/interface";

/**
 * One gap-free mouth range on the emission clock.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-final-bytes-authority Keeps timing derived from the final synthesized bytes.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Preserves the final-byte phoneme timing that defines each mouth range.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Supports direct arbitrary-frame sampling.
 */
export interface IAutoMovieDialogueMouthRange {
  /**
   * Inclusive film-global emission frame.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Moves the mouth when the actor emits speech.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Separates mouth emission from audible arrival.
   */
  startFrame: number;
  /**
   * Exclusive film-global emission frame.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-seek-equivalence Gives each mouth state an exact range.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Makes seek history unnecessary.
   */
  endFrame: number;
  /**
   * Derived mouth preset or explicit rest.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Uses receipt visemes instead of hand-authored syllable keyframes.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Preserves the closed mouth-target vocabulary.
   */
  viseme: IAutoMovieProductionViseme["viseme"];
}
