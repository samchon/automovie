/**
 * A curved upper lash rooted on the current lid margin. Length is the maximum
 * centreline arc length, not its image-plane height or anterior projection.
 * Angles belong to the observed head frame. Lid performance carries the root
 * and transports the strand by the change in its globe-relative direction.
 * This rigid attachment does not simulate individual-hair dynamics.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates lash length, launch, curl, lateral fan and fibre cross-section from the aperture.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines a bounded numerical strand profile attached to the final upper margin.
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
