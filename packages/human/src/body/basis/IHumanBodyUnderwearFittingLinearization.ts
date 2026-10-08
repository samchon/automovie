import type { IAutoMovieQuadraticRow } from "@automovie/engine";

import type { IHumanBodyUnderwearLiftLinearization } from "./IHumanBodyUnderwearLiftLinearization";

/**
 * Candidate affine proposals and the corresponding original nonlinear merit.
 *
 * @evidence contracts/common.md#principled-implementation Affine upper rows remain distinct from the original nonlinear violation sum and actual lift derivatives; no affine result is treated as original feasibility.
 * @evidence contracts/common.md#clear-and-simple-design One candidate model is shared by feasibility restoration, feasible edge optimization and actual-merit globalization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original nonlinear readings remain attached to their proposed rows rather than replaced by solver slacks.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes normalized total-displacement rows, actual lift derivatives and nonlinear merit.
 * @evidence contracts/modeling.md#spatial-conventions Rows and violation sum are dimensionless; the lift carrier retains raw square-metres and inverse-metre gradients.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This optimization model defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries internal candidate values, without authoring controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Contains proposed constraints, not render primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing cut and evaluator retain material incidence.
 * @evidenceExclude contracts/modeling.md#rendered-observation Original rendered acceptance remains downstream.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical limits and the field remain with their existing owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal proposals cannot author source anatomy.
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
