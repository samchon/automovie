/**
 * A curved lower lash rooted on the current lower lid margin, in a frame that
 * mirrors the upper profile's about the head's horizontal plane.
 *
 * Length is the maximum centreline arc length. `elevation` is the initial
 * tangent's angle from anterior +Z towards inferior -Y, and positive `curl`
 * turns the strand away from the eye, downwards. With these mirrored angles
 * the same numbers describe a lower row shaped like the upper row reflected
 * through the horizontal plane. One record shapes every lower lash of one eye.
 * The bounds are those of `humanFaceLowerLashParameters`, a convention that
 * mirrors the upper envelope because no calibrated lower 3D root-frame
 * envelope is held. The right-lid caliper and image-angle study of Kikuchi
 * et al. 2015 (DOI 10.15761/GOD.1000123) does not register this frame, so these
 * bounds are not a measured population range.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerLashProfile {
  /** Maximum centreline arc length in [0.1,20] mm. */
  length: number;

  /** Initial tangent angle from anterior +Z towards inferior -Y, in [-75,75] degrees. */
  elevation: number;

  /** Signed tangent turn from root to tip in [-60,120] degrees; positive turns away from the eye, downwards. */
  curl: number;

  /** Medial-to-lateral fan span in [0,90] degrees; opposite eyes mirror its head-X direction. */
  fan: number;

  /** Root radius in [0.005,0.2] mm. */
  radius: number;

  /** Fraction of root radius removed at the tip in [0,0.98]; the tip remains nonzero. */
  taper: number;

  /** Maximum deterministic per-strand length reduction in [0,0.5]. */
  variation: number;
}
