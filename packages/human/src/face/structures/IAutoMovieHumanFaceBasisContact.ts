import type { IAutoMovieHumanFaceContactClosure } from "./IAutoMovieHumanFaceContactClosure";
import type { IAutoMovieHumanFaceContactCollider } from "./IAutoMovieHumanFaceContactCollider";
import type { IAutoMovieHumanFaceContactPassage } from "./IAutoMovieHumanFaceContactPassage";
import type { IAutoMovieHumanFaceContactSoftSurface } from "./IAutoMovieHumanFaceContactSoftSurface";
import type { IAutoMovieHumanFaceLipMarginPair } from "./IAutoMovieHumanFaceLipMarginPair";
import type { IAutoMovieHumanFaceMidlinePair } from "./IAutoMovieHumanFaceMidlinePair";

/**
 * The coupled oral contact a face basis evaluates after articulation.
 *
 * Lip closure is scaled to the aperture it has to close, the tongue passes
 * through the incisors and lips, and soft tissue is kept outside the rigid
 * dental and ocular surfaces. Every quantity is measured on the evaluated
 * document, never read from a per-person table, and an impossible combination
 * is refused by name rather than clamped. `IAutoMovieHumanFaceBasis.contact`
 * documents the complete evaluation order.
 *
 * @evidence contracts/common.md#principled-implementation Apertures, passage and collider floors are measured on each evaluated document and impossible combinations refuse by name.
 * @evidence contracts/common.md#clear-and-simple-design One named record groups the aperture pairs, closure companion, passage, colliders, soft surfaces and tolerance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every site and distance is shared basis data, never a per-person table or fixture-selected tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the coupled stages, the measured-not-tabled rule and where the full order is documented.
 * @evidence contracts/modeling.md#spatial-conventions Every distance is metres in the Y-up head frame and every vertex is an index into its named surface.
 * @evidence contracts/modeling.md#shared-boundaries Soft surfaces are held outside the rigid colliders they meet.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record addresses existing surfaces and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Its closure and passage name existing channels; the record defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner and face builder observe the evaluated form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Its member records state their own anatomical sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record bounds no value; the contact owner refuses by name.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis data is not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisContact {
  /** Vermilion seam midline vertices on one surface, upper then lower. */
  lips: IAutoMovieHumanFaceMidlinePair;

  /**
   * Vermilion margin pairs on the same surface toward each commissure.
   * Closure weight one seals every pair together with the central one;
   * omission seals the central pair alone.
   */
  margin?: IAutoMovieHumanFaceLipMarginPair[];

  /** Incisal edge midline vertices on one surface, upper then lower. */
  incisors: IAutoMovieHumanFaceMidlinePair;

  /** Native companion channel/reference, with optional post-replay source closure. */
  closure: IAutoMovieHumanFaceContactClosure;

  /** Tongue surface, its protrusion channel and the slab half-width about the incisal plane, in metres. */
  passage: IAutoMovieHumanFaceContactPassage;

  /** Rigid colliders (dental arches, globes): closure triangles over resident vertices, the sheet reach and the covering tissue's least thickness, in metres. */
  colliders: IAutoMovieHumanFaceContactCollider[];

  /** Soft surfaces held outside the colliders, each with the metres it may be pushed before refusal. */
  soft: IAutoMovieHumanFaceContactSoftSurface[];

  /** Metres of new penetration tolerated before a push or refusal, absorbing row rounding. */
  toleranceMetres: number;
}
