/** The neck ring's place and size. */
export interface IAutoMovieHumanHeadNeck {
  /** Section mean height, distinct from the adopted posterior C7 point, calibration mm. */
  level: number;

  /** Centre ahead of the origin. */
  x: number;

  /** Circle-equivalent scale G/(2*pi); this alone does not close a noncircular head-mass section's actual tape. */
  radius: number;

  /** The ring's back on the midline, forward place. */
  back: number;

  /** Actual height of that posterior point, distinct from the section mean, calibration mm. */
  backLevel: number;

  /** That back's forward run per millimetre of height, `dx/dy`. */
  backSlope: number;
}
