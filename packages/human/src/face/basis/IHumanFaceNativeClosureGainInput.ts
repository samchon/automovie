import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

/** Native closure field inputs owned by the central aperture/closure evaluator.
 * The solver borrows all buffers and returns a fresh gain field. Tissue budget
 * and contact tolerance retain the source contract's metres, not solver units.
 *
 * @evidence contracts/common.md#principled-implementation Actual native lip support, closure deltas, articulation and original contact budget define the coupled vertex-gain field constrained by central pair and material-course graphs.
 * @evidence contracts/common.md#clear-and-simple-design The central closure evaluator supplies source/pose data once; createHumanFaceNativeClosureGain owns candidate solving and actual posed/refined verification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Budgets/tolerance remain source-authored physical units rather than normalized solver slack; native correspondence and admitted articulation are caller premises, not inferred anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish borrowed rest buffers, per-vertex deltas, unit direction, central gain and physical response/budget meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input executes no solve; gain and step owners carry geometry/QP costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; the gain owner shares source support and response data across its own iterations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; the call borrows input buffers and returns its own gain field.
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
