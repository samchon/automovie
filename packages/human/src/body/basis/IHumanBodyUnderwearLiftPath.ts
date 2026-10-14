import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";

/**
 * Exact represented-coordinate quadratic minimum over the complete signed lift.
 *
 * @evidence contracts/common.md#principled-implementation Exact rational quadratic coefficients and sign accompany rounded minimum/witness values over the complete signed normal-lift interval.
 * @evidence contracts/common.md#clear-and-simple-design One result separates exact positivity from binary64 presentation and preserves all tied endpoint/interior witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rounded positive minimum cannot replace exact sign, and a constant minimum retains the whole-interval degeneracy explicitly.
 * @evidence contracts/common.md#meaningful-documentation Members give coefficient units by power, signed-meter witness locations and exact versus nearest-binary64 meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Lift-path typing performs no rational polynomial minimization or witness extraction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Exact represented-coordinate outputs store no reusable polynomial result across changing candidates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Coefficient and witness arrays acquire no lifted mesh or retained arithmetic evaluator.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftPath {
  /** Nearest binary64 minimum in square metres; exactPositive retains the exact sign. */
  minimum: number;

  /** True only when the exact rational minimum is strictly positive. */
  exactPositive: boolean;

  /** Every endpoint or interior stationary witness tied at the exact minimum, in signed metres. */
  locations: number[];

  /** True when every point of a nonzero interval attains the same exact minimum. */
  constant: boolean;

  /** Exact coefficients in ascending offset power: square metres, metres, then dimensionless. */
  coefficients: IHumanExactFraction[];
}
