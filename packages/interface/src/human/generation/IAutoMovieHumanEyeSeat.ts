/**
 * Spherical eye seat used by the eyelids and body apertures.
 * HeadLane derives this sphere from the head prior and body scale. Its centre
 * is in the registered figure frame in millimetres; its positive radius is
 * also in millimetres. It does not describe the appearance eye's complete
 * ellipsoid and cornea, or establish a measured fit to an eyeball surface.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the spherical seating geometry shared by eyelids and body apertures, and distinguishes it from the appearance eye's geometry.
 * @evidence contracts/development/design.md#principled-representation `side`: Anatomical side: left is +Z. `centre`: Globe centre in mm. `radius`: Globe radius in mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodyApertures.prepare, AutoMovieHumanEyelid.create, AutoMovieHumanEyelid.seat. Also types AutoMovieHumanBodyApertures.globe, AutoMovieHumanSkeletonLaw.eyes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `side`, `centre`, `radius`; callers supply the complete record.
 */
export interface IAutoMovieHumanEyeSeat {
  /** Anatomical side: left is +Z. */
  side: "left" | "right";

  /** Seat centre in the registered figure frame, mm. */
  centre: [number, number, number];

  /** Positive seat radius, mm. */
  radius: number;
}
