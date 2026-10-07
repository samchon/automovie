import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Named geometric document members consumed by one pose/cache pipeline.
 * Brow and lash geometry are built downstream from skin, but their profiles own the
 * model occlusion cache identity. Named members prevent anatomy from changing
 * meaning when another producer joins the shared evaluator's call boundary.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the document's named geometry members together so the evaluator and cache preserve the same input identities.
 * @evidence contracts/common.md#clear-and-simple-design One optional-member carrier is shared by pose evaluation and invalidation without another anatomical representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transports the actual admitted document members without substituting source profiles or subject-specific geometry.
 * @evidence contracts/common.md#meaningful-documentation Identifies native and downstream-generated geometry as inputs to the shared cache boundary.
 * @evidence contracts/modeling.md#parameter-channels Preserves each named document member's independent and paired controls; their document owners define neutral states and coupling.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This transport defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This transport chooses no primitive population.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Document member owners retain their protocols and units; the envelope performs no conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries This transport constructs no surface or tissue join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The pose and generated-part consumers own displayed output; this envelope displays none.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Document member owners establish anatomical quantities; this envelope establishes no new value.
 * @evidenceExclude contracts/anatomy.md#permitted-range This carrier admits no range or combination; document admission precedes it.
 * @evidence contracts/anatomy.md#parametric-authority Retains named document measurements and closed profiles without introducing personal vertex, curve or strand controls.
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
