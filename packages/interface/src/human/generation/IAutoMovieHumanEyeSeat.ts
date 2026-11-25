/**
 * Spherical eye seat used by the eyelids and body apertures. HeadLane derives
 * this sphere from the head prior and body scale. Its centre is in the
 * registered figure frame in millimetres; its positive radius is also in
 * millimetres. It does not describe the appearance eye's complete ellipsoid and
 * cornea, or establish a measured fit to an eyeball surface.
 */
export interface IAutoMovieHumanEyeSeat {
  /** Anatomical side: left is +Z. */
  side: "left" | "right";

  /** Seat centre in the registered figure frame, mm. */
  centre: [number, number, number];

  /** Positive seat radius, mm. */
  radius: number;
}
