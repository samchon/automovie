import { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";

/**
 * Compiled dialogue mouth layer for one actor.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Makes the derived channel visible to builder and review consumers.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Defines a deterministic seekable artifact.
 */
export interface IAutoMovieDialogueVisemeTimeline {
  /**
   * Joined dialogue line identity.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-final-bytes-authority Retains the authoritative dialogue identity.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Binds the derived phoneme state to its final-byte dialogue line.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Binds the timeline to its source line.
   */
  line: string;
  /**
   * Resolved actor node.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Records the join target.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Makes actor ownership inspectable.
   */
  actor: string;
  /**
   * Gap-free ranges covering the line, including explicit rest.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-seek-equivalence Preserves silence without playback history.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Gives arbitrary seek one canonical answer.
   */
  ranges: IAutoMovieDialogueMouthRange[];
}
