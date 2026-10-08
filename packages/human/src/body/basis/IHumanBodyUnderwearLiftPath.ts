import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";

/**
 * Exact represented-coordinate quadratic minimum over the complete signed lift.
 *
 * @evidence contracts/common.md#principled-implementation The rounded minimum and exactPositive flag remain separate so binary64 underflow cannot change the rational strict sign; exact finite ties and constant-path identity retain the minimizer population.
 * @evidence contracts/common.md#clear-and-simple-design One path result serves the evaluator's original first witness and the linearizer's full finite tie population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positive margin replaces the exact sign and no selected endpoint pretends to represent an entire constant-path directional derivative.
 * @evidence contracts/common.md#meaningful-documentation Documents rounded versus exact meaning, finite witnesses, continuum identity and coefficient units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions The minimum is square metres, witness locations are signed metres, and ascending coefficients carry square metres, metres and dimensionless units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
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
