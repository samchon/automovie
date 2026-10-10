import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";

/**
 * Exact represented-coordinate quadratic minimum over the complete signed lift.
 *
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
