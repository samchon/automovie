/**
 * The radius law and arc-length search interval used to locate a digit's distal
 * cap.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitTipCap in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanDigitTipCap {
  /** A cap's fixed inputs. */
  export interface IInput {
    /**
     * The section's mean radius `sqrt(width * depth)` at an arc length along
     * the line, mm.
     */
    radius: (s: number) => number;

    /** Arc length of the digit's apex along its line, mm. */
    length: number;

    /** Arc length of the first section to search from, mm. */
    from: number;
  }
}
