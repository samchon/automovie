import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMinimusAttachmentsRecord<Side extends AutoMovieHumanBodySide> {
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
 * @evidence contracts/common.md#principled-implementation The single-element tuples force exactly one deep iliac origin site and the one anterior greater-trochanter facet, both typed by `Side`, so the record cannot borrow the medius lateral facet or the opposite side.
 * @evidence contracts/common.md#clear-and-simple-design Two readonly members, the origins and the insertions, each a closed union of named structure and site; nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the distinct sites prevent using the medius facet or the other side and that positions are derived from validated generated bones and never from input coordinates; each member names its site.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The declaration defines no part or group: it relates gluteus minimus to the same-side coxal bone and femur through named attachment sites and copies neither bone's shape or measurements.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names attachment sites, not shape channels: no value varies a form and nothing here has a neutral zero.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The declaration holds no value with a unit or a frame: every entry is a structure name and a site name.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume: it names the sites where a generated muscle must meet bone or fascia, and the generator that resolves them owns that boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is a set of attachment names that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits no anatomical quantity: a site is a name from a closed union and the closed schema rejects any other value; the sites are relations, not measurements.
 * @evidence contracts/anatomy.md#parametric-authority Every entry is a structure of the same side and a site from a closed union of named landmarks, so a caller can name an attachment but cannot place one: no coordinate, vertex or surface patch is expressible.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMinimusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide ? IAutoMovieHumanBodyGluteusMinimusAttachmentsRecord<Side> : never;
