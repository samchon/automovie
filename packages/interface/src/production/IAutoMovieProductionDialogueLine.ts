/**
 * One caption placement that also owns its synthesized dialogue timing.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `IAutoMovieProductionDialogueLine` as the portable data boundary for the sound dialogue voice consistency requirement.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `IAutoMovieProductionDialogueLine` for the dialogue voice consistency and phoneme state system contract.
 */
export interface IAutoMovieProductionDialogueLine {
  /**
   * Exact builder-owned caption id.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `id` as the portable data boundary for the sound dialogue voice consistency requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `id` for the dialogue voice consistency and phoneme state system contract.
   */
  id: string;
  /**
   * Spoken and captioned text.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `text` as the portable data boundary for the sound dialogue voice consistency requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `text` for the dialogue voice consistency and phoneme state system contract.
   */
  text: string;
  /**
   * BCP-47-ish authored language label.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `language` as the portable data boundary for the sound dialogue voice consistency requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `language` for the dialogue voice consistency and phoneme state system contract.
   */
  language: string;
  /**
   * Optional authored speaker identity.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `speaker` as the portable data boundary for the sound dialogue voice consistency requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `speaker` for the dialogue voice consistency and phoneme state system contract.
   */
  speaker?: string;
  /**
   * Film-global inclusive start frame.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `startFrame` as the portable data boundary for the sound dialogue voice consistency requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `startFrame` for the dialogue voice consistency and phoneme state system contract.
   */
  startFrame: number;
  /**
   * Film-global exclusive end frame.
   *
   * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-voice-consistency Exposes `endFrame` as the portable data boundary for the sound dialogue voice consistency requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Types `endFrame` for the dialogue voice consistency and phoneme state system contract.
   */
  endFrame: number;
}
