import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Deep minimus origin and anterior greater-trochanter insertion.
 *
 * The distinct sites prevent using the medius lateral facet or the other
 * side. Attachment positions are derived from validated generated bones,
 * never input coordinates or a copied CT voxel.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGluteusMinimusAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** Deep iliac origin between the anterior and inferior gluteal lines. */
  readonly origins: readonly [
    {
      structure: `${Side}CoxalBone`;
      site: "iliumBetweenAnteriorAndInferiorGlutealLines";
    },
  ];
  /** Anterior facet of the same side's greater trochanter. */
  readonly insertions: readonly [
    {
      structure: `${Side}Femur`;
      site: "greaterTrochanterAnteriorFacet";
    },
  ];
}
