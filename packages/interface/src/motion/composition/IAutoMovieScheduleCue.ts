/** A named instant of a cue track or of a placed entry. */
export interface IAutoMovieScheduleCue {
  /** The instant's name; a track may repeat one, as a score repeats `beat`. */
  name: string;

  /**
   * Absolute film seconds, not an offset from the current intent. Numeric
   * validity is the law's responsibility.
   */
  seconds: number;
}
