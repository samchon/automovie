import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

/** Native closure field inputs owned by the central aperture/closure evaluator.
 * The solver borrows all buffers and returns a fresh gain field. Tissue budget
 * and contact tolerance retain the source contract's metres, not solver units.
 *
 * @author Samchon
 */
export interface IHumanFaceNativeClosureGainInput {
  /** Actual lips surface, including native/refinement correspondence. */
  surface: IAutoMovieHumanFaceBasisSurface;

  /** Original contact limits and native lip courses. */
  contact: IAutoMovieHumanFaceBasisContact;

  /** Current rest XYZ buffer before closure and rigid posing. */
  positions: readonly number[];

  /** Sparse endpoint expanded to one XYZ delta per vertex. */
  delta: Float64Array;

  /** Existing source articulation maps. */
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>;

  /** Mandibular axis in the canonical head frame. */
  axis: readonly [number, number, number];

  /** Unit opening direction in the canonical head frame. */
  up: IAutoMovieVector3;

  /** Central pair closure gain, kept on all off-margin surfaces. */
  ratio: number;

  /** Unchanged source soft-tissue extent in metres. */
  budget: number;

  /** Existing closure owner's per-unit opening response threshold, metres. */
  movableMetres: number;
}
