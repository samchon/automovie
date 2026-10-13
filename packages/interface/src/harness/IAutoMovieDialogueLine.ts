/**
 * One spoken line inside a beat: who says what, optionally pinned to the beat's
 * local clock. Dialogue text is authoring data. Audio rendering belongs to the
 * diffusion side.
 *
 * In this repository the screenplay export is its reader: it prints the
 * speaker in capitals and, when anchored, `[t=<anchor>s]` before the text.
 * Viseme joins read the production dialogue records instead, and no cut-timing
 * pass reads this type.
 *
 * @author Samchon
 */
export interface IAutoMovieDialogueLine {
  /**
   * Cast character (or scene node) who speaks; non-empty, and not checked
   * against the cast.
   */
  speaker: string;

  /** The spoken line, verbatim and non-empty. */
  text: string;

  /**
   * Seconds into the beat this line lands, finite and `>= 0`, riding the
   * timing-anchor spirit ({@link IAutoMovieTimingAnchor}), or `null` when the
   * line floats freely inside the beat.
   */
  anchor: number | null;
}
