import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMinimusAttachmentsRecord<
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

/**
 * Deep minimus origin and anterior greater-trochanter insertion.
 *
 * The distinct sites prevent using the medius lateral facet or the other
 * side. Attachment positions are derived from validated generated bones,
 * never input coordinates or a copied CT voxel.
 *
 * The type distributes over `Side`: a record is wholly one side's, so a union
 * `Side` admits either side's record and never a record that mixes the two.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMinimusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide
  ? IAutoMovieHumanBodyGluteusMinimusAttachmentsRecord<Side>
  : never;
