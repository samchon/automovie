/**
 * Explicit authored-speaker to compiled-actor binding.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Requires a deterministic speaker-to-actor path.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Joins final-byte visemes to one resolved actor.
 */
export interface IAutoMovieDialogueSpeakerBinding {
  /**
   * Authored speaker identity carried by the dialogue line.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Does not infer a speaker from cast order.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Makes the join key explicit.
   */
  speaker: string;
  /**
   * Resolved actor node that owns the mouth layer.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Targets the speaking actor.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Places the derived channel on the compiled actor.
   */
  actor: string;
}
