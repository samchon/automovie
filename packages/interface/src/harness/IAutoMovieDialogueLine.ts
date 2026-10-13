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
 * @evidence contracts/common.md#principled-implementation A speaker, verbatim text and an optional beat-local anchor, the minimum a screenplay line needs; validation checks non-empty speaker and text and a finite non-negative anchor only.
 * @evidence contracts/common.md#clear-and-simple-design Lines sit in order inside the beat payload rather than in a separate track, so dialogue is authored next to its beat's stage direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No speaker is special-cased; `speaker` is free text that nothing resolves against the cast, the anchor is not checked against the beat's length, and viseme joins use `IAutoMovieProductionDialogueLine` rather than this type.
 * @evidence contracts/common.md#meaningful-documentation States who the speaker may be, that text is verbatim, the anchor's unit, bounds and `null` meaning, and which export reads the line.
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
