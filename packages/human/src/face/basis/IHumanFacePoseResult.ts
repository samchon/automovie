import type { IHumanConstructionCheck } from "../../common/basis/IHumanConstructionCheck";
import type { IHumanFaceOpticalAssembly } from "../anatomy/eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFacePeriocularTissuePart } from "../anatomy/eye/structures/IHumanFacePeriocularTissuePart";
import type { IHumanFaceOralAssembly } from "../anatomy/oral/IHumanFaceOralAssembly";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

/**
 * Owned final coordinates, normals and the contact state emitted together.
 * Generated optics are retained beside their posed skin so drawing never
 * rebuilds the collider or its placement from a later appearance edit.
 *
 * @evidence contracts/common.md#principled-implementation The pose evaluator emits same-state final native positions/normals, original check closures and generated optical/oral/tissue correspondence together with contact observations.
 * @evidence contracts/common.md#clear-and-simple-design One immutable-consumer result keeps exact geometry beside the source/jaw/reference state used by generated finish composition and final admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained checks still execute after complete model construction; pose completion or report-only summary alone certifies no final anatomy, crossings or real GPU rendering.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish final performed buffers, optional contact/reference/assemblies and exact source jaw ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result evaluates nothing; the pose and assembly owners carry their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; immutable consumers/cache reuse the exact completed geometry without rebuilding colliders from appearance edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; retained arrays, assemblies and original check closures live with the pose/cache owner.
 *
 * @author Samchon
 */
export interface IHumanFacePoseResult {
  /** Original checks over retained geometry, executed after common model construction. */
  checks: readonly IHumanConstructionCheck[];

  /** Final performed basis positions; callers treat buffers as immutable. */
  positions: ReadonlyMap<string, readonly number[]>;

  /** Common normals computed on these positions. */
  normals: ReadonlyMap<string, readonly number[]>;

  /** Contact measurements, or null for a basis without contact. */
  summary: IAutoMovieHumanFaceContactSummary | null;

  /** Independent optics evaluated against the same current skin. */
  optics?: IHumanFaceOpticalAssembly[];

  /** Evaluated source shape-only reference, after the source refinement owner. */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Coarse oral rest assembly, carried once by the matching jaw motion at finish. */
  oral?: IHumanFaceOralAssembly;

  /** Exact jaw owner used to pose source crowns and generated mandibular lining. */
  jawMotion?: IAutoMovieHumanFaceRigidMotion;

  /** Actual performed lid tissue shells, with original resting/performed checks retained separately. */
  periocularTissues?: IHumanFacePeriocularTissuePart[];
}
