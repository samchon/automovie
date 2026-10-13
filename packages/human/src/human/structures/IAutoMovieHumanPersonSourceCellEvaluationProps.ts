import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourcePartitionPlan } from "./IAutoMovieHumanPersonSourcePartitionPlan";

/**
 * What admitting one performed pair of complementary source skins reads: the admitted partition plan, the face and body triangle indices it was compiled for, and the performed skin to evaluate.
 *
 * @evidence contracts/common.md#principled-implementation Captured face and body topology plus the admitted plan constrain the current performed skin population before area and shared-sample checks.
 * @evidence contracts/common.md#clear-and-simple-design Invariant topology and variable performed skin are explicit operands of the same geometry admission owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The current body indices remain an operand to compare with the captured cut topology rather than silently accepting changed lineage.
 * @evidence contracts/common.md#meaningful-documentation Properties identify admitted source plan, flat face and retained-body triangles, and the current skin being evaluated.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The captured topology and current geometry admission inputs are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the captured topology and current geometry admission inputs; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring captured topology and current geometry admission inputs acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceCellEvaluationProps {
  /** The admitted source partition plan. */
  plan: IAutoMovieHumanPersonSourcePartitionPlan;

  /** Face skin triangle vertex index triples. */
  faceIndices: readonly number[];

  /** Body skin triangle vertex index triples retained by the cut. */
  bodyIndices: readonly number[];

  /** The performed skin to evaluate. */
  input: IAutoMovieHumanPersonPerformedSkin;
}
