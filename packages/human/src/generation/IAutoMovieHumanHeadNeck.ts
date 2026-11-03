/** The neck ring's place and size. */
export interface IAutoMovieHumanHeadNeck {
  /** Height. */
  level: number;

  /** Centre ahead of the origin. */
  x: number;

  /** Tube's radius above the ring, from the neck tape. */
  radius: number;

  /** The ring's back on the midline, forward place. */
  back: number;

  /** That back's forward run per millimetre of height, `dx/dy`. */
  backSlope: number;
}
