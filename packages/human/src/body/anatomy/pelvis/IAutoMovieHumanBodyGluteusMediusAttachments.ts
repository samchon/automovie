import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMediusAttachmentsRecord<Side extends AutoMovieHumanBodySide> {
  /** Iliac origin between the gluteal lines. */
  readonly origins: readonly [
    {
      structure: `${Side}CoxalBone`;
      site: "iliumBetweenGlutealLines";
    },
  ];
  /** Facet on this side's greater trochanter. */
  readonly insertions: readonly [
    {
      structure: `${Side}Femur`;
      site:
        | "greaterTrochanterLateralFacet"
        | "greaterTrochanterSuperoposteriorFacet";
    },
  ];
}

/**
 * Gluteus medius origin on ilium and insertion on the greater trochanter.
 *
 * Both references share the same side and require resolved bone surfaces;
 * a rig hip point cannot identify the tendon footprint.
 *
 * The type distributes over `Side`: a record is wholly one side's, so a union
 * `Side` admits either side's record and never a record that mixes the two.
 *
 * @evidence contracts/common.md#principled-implementation The single-element tuples `[X]` force exactly one iliac origin site and one insertion site, and both are typed by `Side`, so the record can only relate the iliac region of this side's coxal bone to a facet of this side's femur; the insertion union allows the two greater-trochanter facets the type names. A conditional type that distributes over `Side` makes a union `Side` admit either side's whole record and never one mixing the two, which a record typed by the union directly would have admitted.
 * @evidence contracts/common.md#clear-and-simple-design The record is one interface of two readonly members, the origins and the insertions, each a closed union of named structure and site, and the exported type only distributes it over `Side`; the distribution is the single added mechanism and exists because a template-literal member typed by a union `Side` would otherwise pair a left origin with a right insertion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that both references share a side and require resolved bone surfaces and that a rig hip point cannot identify the tendon footprint; each member names its site.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The declaration defines no part or group: it relates gluteus medius to the same-side coxal bone and femur through named attachment sites and copies neither bone's shape or measurements.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names attachment sites, not shape channels: no value varies a form and nothing here has a neutral zero.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The declaration holds no value with a unit or a frame: every entry is a structure name and a site name.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume: it names the sites where a generated muscle must meet bone or fascia, and the generator that resolves them owns that boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is a set of attachment names that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits no anatomical quantity: a site is a name from a closed union and the closed schema rejects any other value; the sites are relations, not measurements.
 * @evidence contracts/anatomy.md#parametric-authority Every entry is a structure of the same side and a site from a closed union of named landmarks, so a caller can name an attachment but cannot place one: no coordinate, vertex or surface patch is expressible.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMediusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide ? IAutoMovieHumanBodyGluteusMediusAttachmentsRecord<Side> : never;
