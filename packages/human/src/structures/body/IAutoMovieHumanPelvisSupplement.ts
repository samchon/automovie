/** Pelvic section dimensions and height anchors. */
export interface IAutoMovieHumanPelvisSupplement {
  /** Standing height of the maximum buttock section, mm, above the standing-surface datum. */
  buttockMaximumHeightMm: number;

  /** Anterior partition of the buttock section depth, mm. */
  buttockAnteriorReachMm: number;

  /** Posterior median recess relative to the buttock envelope, mm. */
  posteriorMedianRecessMm: number;

  /** Skin-envelope breadth at the iliac section, mm; distinct from compressed bicristal breadth. */
  iliacSkinBreadthMm: number;

  /** Standing height of the internal roof crown, mm; an internal construction dimension, not a clinical event claim. */
  perinealCrownHeightMm: number;
}
