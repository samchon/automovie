import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMinimusAttachmentsRecord<
  Side extends AutoMovieHumanBodySide,
> {
  /** Deep iliac origin between the anterior and inferior gluteal lines. */
  readonly origins: readonly [
    {
      /** Same-side anatomical structure owning this attachment footprint. */
      structure: `${Side}CoxalBone`;

      /** Named surface region, resolved from generated bone anatomy rather than input coordinates. */
      site: "iliumBetweenAnteriorAndInferiorGlutealLines";
    },
  ];

  /** Anterior facet of the same side's greater trochanter. */
  readonly insertions: readonly [
    {
      /** Same-side anatomical structure owning this attachment footprint. */
      structure: `${Side}Femur`;

      /** Named surface region, resolved from generated bone anatomy rather than input coordinates. */
      site: "greaterTrochanterAnteriorFacet";
    },
  ];
}

/**
 * Deep minimus origin and anterior greater-trochanter insertion.
 *
 * The distinct sites prevent using the medius lateral facet or the other side. Attachment positions are derived from validated generated bones, never input coordinates or a copied CT voxel.
 *
 * The type distributes over `Side`: a record is wholly one side's, so a union `Side` admits either side's record and never a record that mixes the two.
 *
 * @evidence contracts/common.md#principled-implementation A distributive side conditional keeps minimus iliac origin and anterior trochanteric insertion together on one side.
 * @evidence contracts/common.md#clear-and-simple-design The relation record owns specific minimus surface sites rather than generic hip coordinates or medius facets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Attachment positions cannot be copied from a CT voxel or substituted with the medius lateral footprint.
 * @evidence contracts/common.md#meaningful-documentation Comments explain anterior/inferior iliac and anterior-trochanter ownership, resolved-surface requirements and side distribution.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Minimus attachment typing executes no voxel selection or tendon-footprint generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This deep relation schema caches no resolved pelvic/femoral attachment computation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Minimus site names acquire no imaging bytes, bone surfaces or registration sessions.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMinimusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide
  ? IAutoMovieHumanBodyGluteusMinimusAttachmentsRecord<Side>
  : never;
