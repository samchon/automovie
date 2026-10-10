import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Named geometric document members consumed by one pose/cache pipeline.
 * Brow and lash geometry are built downstream from skin, but their profiles own the
 * model occlusion cache identity. Named members prevent anatomy from changing
 * meaning when another producer joins the shared evaluator's call boundary.
 *
 * @author Samchon
 */
export interface IHumanFacePoseGeometry {
  /** Independent optical exterior and source placement. */
  eyes?: IAutoMovieHumanFaceBasisDocument["eyes"];

  /** Regional skin identity and performed relief before contact. */
  skinRelief?: IAutoMovieHumanFaceBasisDocument["skinRelief"];

  /** Native oral identity and its generated lining/query assembly. */
  oral?: IAutoMovieHumanFaceBasisDocument["oral"];

  /** Attached lid tissue shell dimensions, admitted in both states. */
  periocularTissues?: IAutoMovieHumanFaceBasisDocument["periocularTissues"];

  /** Downstream shaft geometry included in the model occlusion identity. */
  brows?: IAutoMovieHumanFaceBasisDocument["brows"];

  /** Downstream lash shafts included in the model occlusion identity. */
  lashes?: IAutoMovieHumanFaceBasisDocument["lashes"];

  /** Shared host lid identity applied before native source posing. */
  eyelids?: IAutoMovieHumanFaceBasisDocument["eyelids"];

  /** Named resting crease and hood morphology, converted before native posing. */
  eyelidPhenotypes?: IAutoMovieHumanFaceBasisDocument["eyelidPhenotypes"];

  /** Medial and wet-margin surface geometry included in the model occlusion identity. */
  ocularSurfaces?: IAutoMovieHumanFaceBasisDocument["ocularSurfaces"];
}
