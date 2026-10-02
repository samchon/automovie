/**
 * A curved upper lash rooted on the current lid margin. Length is the maximum
 * centreline arc length, not its image-plane height or anterior projection.
 * Angles belong to the observed head frame. Lid performance carries the root
 * and transports the strand by the change in its globe-relative direction.
 * This rigid attachment does not simulate individual-hair dynamics.
 *
 * One record shapes every upper lash of one eye. Lengths are millimetres,
 * angles are degrees, and the frame is the head's: +X anatomical left, +Y
 * superior, +Z anterior. The bounds are those of
 * `portraitEyelashParameters`, which are authoring envelopes and not a
 * measured population range.
 *
 * @evidence contracts/common.md#principled-implementation Seven scalars are the complete description of one constant-curvature tapered strand: arc length, initial elevation, total turn, fan, root radius, taper and length variation. Together they fix the centreline and radius profile that `buildPortraitEyelash` sweeps, and nothing else about a strand is stored.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of seven named numbers with one owner for its bounds, `portraitEyelashParameters`. It holds no per-strand list and no option that another field overrides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism: no field names a subject, a photograph or a fixture, and every field is a general strand trait.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit, admitted interval and what a change moves, and the type states the frame and that the bounds are authoring envelopes.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres and angles degrees in the head frame (+Y superior, +Z anterior); each field states its unit, and the builder is the one place that converts degrees to radians.
 * @evidence contracts/anatomy.md#parametric-authority Every field is a named physical trait of the lash population (arc length, curl, fan, radius, taper, variation). None addresses a vertex, a strand or a patch, and the type has no conversion from a simpler input.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a parameter record for a population of strands and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the strand count is `IPortraitEyeShape.upperLashes` and the strand tessellation belongs to `buildPortraitEyelash`.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface and meets no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part and displays nothing.
 * @author Samchon
 */
export interface IPortraitEyelashProfile {
  /** Maximum centreline arc length in [0.1,20] mm; canthal and growth weights shorten individual lashes. */
  length: number;

  /** Observed initial tangent elevation from anterior +Z towards superior +Y, in [-75,75] degrees; lid motion transports this direction. */
  elevation: number;

  /** Signed tangent turn from root to tip in [-60,120] degrees; positive curls upwards. */
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
