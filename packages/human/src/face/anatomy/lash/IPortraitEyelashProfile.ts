/**
 * A curved upper lash rooted on the current lid margin. Length is the maximum centreline arc length, not its image-plane height or anterior projection. Angles belong to the observed head frame. Lid performance carries the root and transports the strand by the change in its globe-relative direction. This rigid attachment does not simulate individual-hair dynamics.
 *
 * One record shapes every upper lash of one eye. Lengths are millimetres, angles are degrees, and the frame is the head's: +X anatomical left, +Y superior, +Z anterior. The bounds are those of `portraitEyelashParameters`, which are authoring envelopes and not a measured population range.
 *
 * @evidence contracts/common.md#principled-implementation Seven numerical traits describe maximum arc length, observed elevation, curl, fan, radius, taper and deterministic variation.
 * @evidence contracts/common.md#clear-and-simple-design One upper-eye profile feeds each conventional constant-curvature shaft through buildPortraitEyelash.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored envelopes and rigid globe-relative transport do not establish a measured population range or hair dynamics.
 * @evidence contracts/common.md#meaningful-documentation Head +X is left, +Y superior and +Z anterior; lengths are millimetres and angles degrees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Admission and fixed-lattice shaft construction belong to validator and mesh producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work portraitEyelashParameters supplies shared editable bounds and validation ranges.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns the scalar record; emitted shaft and optional transport state are owned by their actual producer.
 *
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
