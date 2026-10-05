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
 * mirrors the upper envelope because no lower-lash source is held; they are not
 * a measured population range.
 *
 * @evidence contracts/common.md#principled-implementation The seven scalars describe one constant-curvature tapered strand; mirroring the angle frame lets the lower row use the same strand construction without an upper-biased curl interval.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of seven named numbers with one owner for its bounds, `humanFaceLowerLashParameters`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field names a subject or fixture; the mirrored frame is stated rather than borrowed silently from the upper row.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit and direction, and the type states the mirrored frame and the conventional bounds.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres and angles degrees in the head frame (+Y superior, +Z anterior), with elevation measured towards -Y and positive curl turning downwards.
 * @evidence contracts/modeling.md#parameter-channels Seven named shape inputs per eye, independent of the skin channels.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A parameter record for a population of strands; the periocular registration names the part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The lash generator emits the strands.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The registered lower margin owns the root boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No lower-lash measurement source is held; the bounds are a stated convention.
 * @evidence contracts/anatomy.md#permitted-range Admission applies `humanFaceLowerLashParameters`, stated as a convention.
 * @evidence contracts/anatomy.md#parametric-authority Every field is a named strand trait; none addresses a vertex or strand.
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
