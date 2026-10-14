import type { IAutoMovieHumanFaceContactClosure } from "./IAutoMovieHumanFaceContactClosure";
import type { IAutoMovieHumanFaceContactCollider } from "./IAutoMovieHumanFaceContactCollider";
import type { IAutoMovieHumanFaceContactPassage } from "./IAutoMovieHumanFaceContactPassage";
import type { IAutoMovieHumanFaceContactSoftSurface } from "./IAutoMovieHumanFaceContactSoftSurface";
import type { IAutoMovieHumanFaceLipMargin } from "./IAutoMovieHumanFaceLipMargin";
import type { IAutoMovieHumanFaceMidlinePair } from "./IAutoMovieHumanFaceMidlinePair";

/**
 * The coupled oral contact a face basis evaluates after articulation.
 *
 * Lip closure follows its registered replay rule, and passage admission compares the posed tongue section with incisal and lip gaps. Soft tissue follows authored rest-clearance floors against rigid dental/ocular surfaces, with bounded geometric correction and named refusal when no witness verifies. The supplied document's controls are unchanged. A floor may retain source rest penetration, and pointwise clearance does not prove orientation-preserving or intersection-free skin. `IAutoMovieHumanFaceBasis.contact` documents the complete evaluation order.
 *
 * @evidence contracts/common.md#principled-implementation Registered lip/incisor identities, closure replay, tongue passage and soft/collider floors share the evaluated geometry. Actual signed queries and movement budgets verify corrections; posed passage shortages refuse by measured cause.
 * @evidence contracts/common.md#clear-and-simple-design Named closure, passage, collider and soft-surface owners retain their distinct correspondence, reach, cover and movement-budget roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Personal tables replace no geometry reading, solver status alone admits no correction, source rest penetration can remain, and pointwise floors certify neither clinical anatomy nor a globally embedded skin.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes unchanged controls from bounded geometric correction, rest-floor limits and named passage refusal; members give surface identities and metre parameters.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema executes no signed query, QP or passage sectioning.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration describes inputs; collider compilation and staged query reuse belong to contact owners.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns collider/soft records and source indices; this type creates no signed-query handle or staging buffer.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisContact {
  /** Vermilion seam midline vertices on one surface, upper then lower. */
  lips: IAutoMovieHumanFaceMidlinePair;

  /**
   * The fissure's vermilion margin chains on the same surface, commissure to
   * commissure. Closure weight one leaves no point of either chain open;
   * omission seals the central pair alone.
   */
  margin?: IAutoMovieHumanFaceLipMargin;

  /** Incisal edge midline vertices on one surface, upper then lower. */
  incisors: IAutoMovieHumanFaceMidlinePair;

  /** Native companion channel/reference, with optional post-replay source closure. */
  closure: IAutoMovieHumanFaceContactClosure;

  /** Tongue surface, its protrusion channel and the slab half-width about the incisal plane, in metres. */
  passage: IAutoMovieHumanFaceContactPassage;

  /** Rigid colliders (dental arches, globes): closure triangles over resident vertices, the sheet reach and the covering tissue's least thickness, in metres. */
  colliders: IAutoMovieHumanFaceContactCollider[];

  /** Soft surfaces constrained by authored rest-clearance floors, each with its allowed movement in metres before refusal. */
  soft: IAutoMovieHumanFaceContactSoftSurface[];

  /** Metres of new penetration tolerated before a push or refusal, absorbing row rounding. */
  toleranceMetres: number;
}
