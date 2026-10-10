import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMediusAttachmentsRecord<
  Side extends AutoMovieHumanBodySide,
> {
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
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMediusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide
  ? IAutoMovieHumanBodyGluteusMediusAttachmentsRecord<Side>
  : never;
