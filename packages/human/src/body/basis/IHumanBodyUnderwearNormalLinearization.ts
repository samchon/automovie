import type { IHumanBodyUnderwearLiftDerivativeFailure } from "./IHumanBodyUnderwearLiftDerivativeFailure";

/**
 * Analytic sparse derivatives of the actual returned unit normals.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearNormalLinearization {
  /** One Cartesian-index to XYZ derivative map per candidate vertex; values have inverse-metre units. */
  derivatives: Map<number, number[]>[];

  /** Located normal derivative failures retained without freezing a failed normal. */
  unavailable: IHumanBodyUnderwearLiftDerivativeFailure[];
}
