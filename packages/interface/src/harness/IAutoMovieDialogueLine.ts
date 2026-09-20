/**
 * One spoken line inside a beat: who says what, optionally pinned to the beat's
 * local clock. Dialogue text is authoring data. Audio rendering belongs to the
 * diffusion side; the text drives cut rhythm, viseme hints, and the
 * human-readable screenplay export.
 *
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `IAutoMovieDialogueLine` as the portable data boundary for the story dialogue voice text separation requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `IAutoMovieDialogueLine` for the narrative intent dialogue voice text boundary system contract.
 * @author Samchon
 */
export interface IAutoMovieDialogueLine {
  /**
   * Cast character (or scene node) who speaks.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `speaker` as the portable data boundary for the story dialogue voice text separation requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `speaker` for the narrative intent dialogue voice text boundary system contract.
   */
  speaker: string;

  /**
   * The spoken line, verbatim.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `text` as the portable data boundary for the story dialogue voice text separation requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `text` for the narrative intent dialogue voice text boundary system contract.
   */
  text: string;

  /**
   * Seconds into the beat this line lands, riding the timing-anchor spirit
   * ({@link IAutoMovieTimingAnchor}), or `null` when the line floats freely
   * inside the beat.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `anchor` as the portable data boundary for the story dialogue voice text separation requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `anchor` for the narrative intent dialogue voice text boundary system contract.
   */
  anchor: number | null;
}
