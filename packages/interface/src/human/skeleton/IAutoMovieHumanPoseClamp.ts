/** A requested pose value replaced by its range limit. */
export interface IAutoMovieHumanPoseClamp {
  /** Field path with the side resolved, such as `legs.left.knee.flexion`. */
  path: string;

  /**
   * Requested clinical channel value: degrees for angular channels, millimetres
   * for jaw opening, protrusion and lateral excursion.
   */
  requested: number;

  /**
   * Value applied after the channel range clamp, in the same units as
   * requested.
   */
  applied: number;
}
