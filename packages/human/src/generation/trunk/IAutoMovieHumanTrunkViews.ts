/**
 * The trunk as its views draw it, in calibration millimetres in the body frame
 * (forward +X, up +Y, left +Z): the input of the trunk's view part
 * (`AutoMovieHumanTrunkViewPart`).
 *
 * Every value is a knot at a named site at that site's height. The front view
 * gives the left half breadth (the right side is its reflection, J6); the side
 * view gives the front and back profiles as forward places. Each site's values
 * are the person's published measures where they exist (`chestBreadth` at the
 * chest, `waistBreadth` and `waistDepth` at the natural waist, `hipBreadth`
 * and `buttockDepth` at the hip, the heights of ANSUR II and ISO 8559-1) and
 * sourced laws elsewhere; the caller owns which is which, and this type holds
 * only the result, so a law can change without touching the builder.
 *
 * The trunk is drawn without its protrusions: at the chest the front profile
 * is the chest wall's (the breasts are parts of their own), and at the
 * buttock the back profile is the base's (the gluteal masses are parts of
 * their own), so no measure is counted twice (#3047).
 */
export interface IAutoMovieHumanTrunkViews {
  /**
   * The perineum: the trunk's bottom pole, where every outline meets at one
   * point. Its height is the crotch's (ISO 8559-1 5.7.6, the inseam over the
   * lateral malleolus), its forward place on the median line.
   */
  perineum: {
    /** Height, mm. */
    y: number;

    /** Forward place, mm. */
    x: number;
  };

  /**
   * The sites, by strictly rising height above the perineum, each a knot of
   * every outline. The last is the trunk's open top inside the neck, which the
   * neck's merge covers.
   */
  sites: IAutoMovieHumanTrunkViews.ISite[];
}
export namespace IAutoMovieHumanTrunkViews {
  /** One site's knots. */
  export interface ISite {
    /** The measurement site, such as `chest` or `waist`, named in diagnostics and identity checks. */
    site: string;

    /** Height, mm. */
    y: number;

    /** Half breadth of the left lateral outline from the median plane, mm, positive. */
    half: number;

    /** Forward place of the front profile on the median line, mm. */
    front: number;

    /** Forward place of the back profile on the median line, mm, behind `front`. */
    back: number;

    /**
     * What owns the section's fullness here: a taut-tape girth (mm) solved on
     * the site's box, or a sourced conic shoulder value in `(0, 1)` where no
     * tape is taken (`AutoMovieHumanViewSection.ELLIPSE` is the ellipse).
     */
    fullness: { girth: number } | { shoulder: number };
  }
}
