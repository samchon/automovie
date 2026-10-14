import type { IAutoMovieQuadraticRow } from "@automovie/engine";

import type { IHumanBodyUnderwearLiftLinearization } from "./IHumanBodyUnderwearLiftLinearization";

/**
 * Candidate affine proposals and the corresponding original nonlinear merit.
 *
 * @evidence contracts/common.md#principled-implementation Rho-normalized affine rows retain original upper bounds and logical elastic groups beside actual transported-normal derivatives and nonlinear merit.
 * @evidence contracts/common.md#clear-and-simple-design One proposal carrier aligns sparse rows, tied-condition groups and actual lift readback without merging distinct condition kinds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Affine proposals do not certify nonlinear feasibility and tied witnesses share only their original logical condition, not unrelated violations.
 * @evidence contracts/common.md#meaningful-documentation Members give normalization, elastic grouping, distinct condition population and original dimensionless positive-violation sum.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Linearization typing computes no affine row assembly or transported-normal derivative.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Proposal arrays carry one current model without implementing Jacobian or nonlinear-trial reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This row/group schema acquires no native master program or retained derivative workspace.
 * @author Samchon
 */
export interface IHumanBodyUnderwearFittingLinearization {
  /** Rho-normalized total-displacement rows with their original upper bounds. */
  rows: IAutoMovieQuadraticRow[];

  /** Logical condition owning each row's elastic variable; exact tied witnesses share their one condition. */
  elasticGroups: number[];

  /** Distinct original field and located lift conditions, without merging different condition kinds. */
  elasticCount: number;

  /** Actual transported-normal derivatives, located raw values and failures. */
  lift: IHumanBodyUnderwearLiftLinearization;

  /** Dimensionless sum of positive original field and unique lift-condition violations. */
  violationSum: number;
}
