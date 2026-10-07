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
 * @evidence contracts/common.md#principled-implementation A single evaluated result retains the exact geometry used by contact.
 * @evidence contracts/common.md#clear-and-simple-design One named transport replaces the pose evaluator's anonymous result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry or summary is re-estimated by the consumer.
 * @evidence contracts/common.md#meaningful-documentation States ownership and synchronized geometry.
 * @evidence contracts/modeling.md#spatial-conventions Positions and optics remain basis head-frame metres; normals are unit directions.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries evaluated geometry without a measured anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The stage owners admit the geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Result transport, without an authoring control.
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
