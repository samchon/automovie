import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Gluteus medius origin on ilium and insertion on the greater trochanter.
 *
 * Both references share the same side and require resolved bone surfaces;
 * a rig hip point cannot identify the tendon footprint.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGluteusMediusAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** Iliac origin between the gluteal lines. */
  readonly origins: readonly [{
    structure: `${Side}CoxalBone`;
    site: "iliumBetweenGlutealLines";
  }];
  /** Facet on this side's greater trochanter. */
  readonly insertions: readonly [{
    structure: `${Side}Femur`;
    site: "greaterTrochanterLateralFacet" | "greaterTrochanterSuperoposteriorFacet";
  }];
}
