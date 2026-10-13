/**
 * One spoken line inside a beat: who says what, optionally pinned to the beat's
 * local clock. Dialogue text is authoring data. Audio rendering belongs to the
 * diffusion side; the text drives cut rhythm, viseme hints, and the
 * human-readable screenplay export.
 *
 * @author Samchon
 */
export interface IAutoMovieDialogueLine {
  /** Cast character (or scene node) who speaks. */
  speaker: string;

  /** The spoken line, verbatim. */
  text: string;

  /**
   * Seconds into the beat this line lands, riding the timing-anchor spirit
   * ({@link IAutoMovieTimingAnchor}), or `null` when the line floats freely
   * inside the beat.
   */
  anchor: number | null;
}
