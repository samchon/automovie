import type { IHumanBodyUnderwearLiftConstraint } from "./IHumanBodyUnderwearLiftConstraint";
import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";

/**
 * Sparse actual-lift proposals and explicit derivative-domain failures.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftLinearization {
  /** Local signed orientation rows; these do not certify global embedding. */
  rows: IHumanBodyUnderwearLiftConstraint[];

  /** Unavailable rows or normals, retained for the fitting owner to report. */
  unavailable: IHumanBodyUnderwearLiftDerivativeFailure[];
}
