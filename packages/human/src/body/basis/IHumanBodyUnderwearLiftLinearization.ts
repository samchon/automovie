import type { IHumanBodyUnderwearLiftConstraint } from "./IHumanBodyUnderwearLiftConstraint";
import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";

/**
 * Sparse actual-lift proposals and explicit derivative-domain failures.
 *
 * @evidence contracts/common.md#principled-implementation Sparse located orientation rows and explicit unavailable derivative records preserve the actual lift model without silently dropping domain failures.
 * @evidence contracts/common.md#clear-and-simple-design One result separates usable affine proposals from causes the fitting owner must report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Local orientation rows do not certify global embedding and absent rows/normals cannot become acceptance through omission.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish proposed signed rows from retained unavailable normals and derivative causes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lift-result typing computes no analytic row or normal transport algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rows and failures carry one candidate evaluation without implementing cross-state derivative caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The linearization schema describes result arrays but acquires no native program or retained candidate task.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftLinearization {
  /** Local signed orientation rows; these do not certify global embedding. */
  rows: IHumanBodyUnderwearLiftConstraint[];

  /** Unavailable rows or normals, retained for the fitting owner to report. */
  unavailable: IHumanBodyUnderwearLiftDerivativeFailure[];
}
