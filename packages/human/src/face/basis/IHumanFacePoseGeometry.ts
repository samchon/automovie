import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Named geometric document members consumed by one pose/cache pipeline.
 * Brow and lash geometry are built downstream from skin, but their profiles own the
 * model occlusion cache identity. Named members prevent anatomy from changing
 * meaning when another producer joins the shared evaluator's call boundary.
 *
 * @evidence contracts/common.md#principled-implementation Named document geometry profiles feed the shared native/generated pose pipeline; downstream brow/lash profiles also qualify the pose identity used by model AO.
 * @evidence contracts/common.md#clear-and-simple-design Explicit optional members preserve anatomical owner boundaries as producers join the evaluator, instead of positional argument reinterpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission remains producer-defined optional state, not silently manufactured support; profile presence still requires actual source registrations and geometry/contact admission.
 * @evidence contracts/common.md#meaningful-documentation Members identify optical, skin, oral, lid/tissue, shaft and medial/wet-surface responsibilities and stage timing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no posing; actual owners carry source/refinement/generated costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; the pose cache serializes these exact supported profiles for its equivalence boundary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; copied/admitted profiles remain build-owned.
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
