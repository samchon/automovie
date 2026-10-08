import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

/** Native closure field inputs owned by the central aperture/closure evaluator.
 * The solver borrows all buffers and returns a fresh gain field. Tissue budget
 * and contact tolerance retain the source contract's metres, not solver units.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the actual surface, source contact, rigid maps and central gain together for a coupled vertex solve.
 * @evidence contracts/common.md#clear-and-simple-design One input record carries one native closure responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authoring defaults or alternate source enters this transport.
 * @evidence contracts/common.md#meaningful-documentation Names borrowed buffers and the original physical limits.
 * @evidence contracts/modeling.md#spatial-conventions Positions, deltas and budget use canonical head-frame metres; ratio is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The contact owner defines the closure channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The solver consumes the source courses.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries source-owned values without deriving anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solver enforces the transported limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
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
