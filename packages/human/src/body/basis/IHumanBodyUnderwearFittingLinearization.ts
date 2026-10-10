import type { IAutoMovieQuadraticRow } from "@automovie/engine";

import type { IHumanBodyUnderwearLiftLinearization } from "./IHumanBodyUnderwearLiftLinearization";

/**
 * Candidate affine proposals and the corresponding original nonlinear merit.
 *
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
