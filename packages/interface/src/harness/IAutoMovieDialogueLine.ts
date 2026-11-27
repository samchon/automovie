/**
 * One screenplay line inside a beat: speaker, verbatim text and an optional
 * beat-local anchor. This harness record does not drive audio; production
 * dialogue, sound and lip-sync records own those capabilities.
 *
 * `AutoMovieRenderScreenplay.render` is its reader in this repository: it
 * prints the speaker in capitals and, when anchored, `[t=<anchor>s]` before
 * the text. Viseme joins
 * read the production dialogue records instead, and no cut-timing pass reads
 * this type. Project validation requires a non-empty speaker and text, and both
 * it and `validateScriptTree` refuse an anchor that is negative or not finite.
 */
export interface IAutoMovieDialogueLine {
  /**
   * Cast character or scene node who speaks; non-empty, and not checked against
   * the cast.
   */
  speaker: string;

  /** The spoken line, verbatim and non-empty. */
  text: string;

  /**
   * Seconds into the beat this line lands, finite and `>= 0`, in the spirit of
   * {@link IAutoMovieTimingAnchor}, or `null` when the line floats freely inside
   * the beat.
   */
  anchor: number | null;
}
