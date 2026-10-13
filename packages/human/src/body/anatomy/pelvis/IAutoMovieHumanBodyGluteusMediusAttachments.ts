import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMediusAttachmentsRecord<
  Side extends AutoMovieHumanBodySide,
> {
  /** Iliac origin between the gluteal lines. */
  readonly origins: readonly [
    {
      /** Same-side anatomical structure owning this attachment footprint. */
      structure: `${Side}CoxalBone`;

      /** Named surface region, resolved from generated bone anatomy rather than input coordinates. */
      site: "iliumBetweenGlutealLines";
    },
  ];

  /** Facet on this side's greater trochanter. */
  readonly insertions: readonly [
    {
      /** Same-side anatomical structure owning this attachment footprint. */
      structure: `${Side}Femur`;

      /** Named surface region, resolved from generated bone anatomy rather than input coordinates. */
      site:
        | "greaterTrochanterLateralFacet"
        | "greaterTrochanterSuperoposteriorFacet";
    },
  ];
}

/**
 * Gluteus medius origin on ilium and insertion on the greater trochanter.
 *
 * Both references share the same side and require resolved bone surfaces; a rig hip point cannot identify the tendon footprint.
 *
 * The type distributes over `Side`: a record is wholly one side's, so a union `Side` admits either side's record and never a record that mixes the two.
 *
 * @evidence contracts/common.md#principled-implementation The distributive side conditional keeps each medius iliac origin and femoral insertion within the same anatomical side.
 * @evidence contracts/common.md#clear-and-simple-design A nonempty single-origin/single-insertion record exposes named iliac and greater-trochanter footprint ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rig hip point cannot substitute for resolved bony surfaces or identify a tendon footprint.
 * @evidence contracts/common.md#meaningful-documentation Member and declaration comments identify same-side structure/site references and supported greater-trochanter facets.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Medius attachment typing runs no iliac surface search or trochanter footprint fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The medius relation schema holds no computed attachment geometry requiring reuse or invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Medius site references own no bone mesh arrays or attachment-resolution resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMediusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide
  ? IAutoMovieHumanBodyGluteusMediusAttachmentsRecord<Side>
  : never;
