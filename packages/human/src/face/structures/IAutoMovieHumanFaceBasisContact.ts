import type { IAutoMovieHumanFaceContactClosure } from "./IAutoMovieHumanFaceContactClosure";
import type { IAutoMovieHumanFaceContactCollider } from "./IAutoMovieHumanFaceContactCollider";
import type { IAutoMovieHumanFaceContactPassage } from "./IAutoMovieHumanFaceContactPassage";
import type { IAutoMovieHumanFaceContactSoftSurface } from "./IAutoMovieHumanFaceContactSoftSurface";
import type { IAutoMovieHumanFaceLipMargin } from "./IAutoMovieHumanFaceLipMargin";
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

  /** Soft surfaces held outside the colliders, each with the metres it may be pushed before refusal. */
  soft: IAutoMovieHumanFaceContactSoftSurface[];

  /** Metres of new penetration tolerated before a push or refusal, absorbing row rounding. */
  toleranceMetres: number;
}
