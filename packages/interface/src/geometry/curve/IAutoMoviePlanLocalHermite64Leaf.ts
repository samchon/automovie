import type { IAutoMovieLocalHermiteField64 } from "./IAutoMovieLocalHermiteField64";

/**
 * Retained adaptive restriction of one physical Hermite interval. Inherited u0/u1
 * refer to normalized course phase; the inherited grid contains restricted
 * millimetre Bernstein coefficients, with rows along station and columns along u.
 *
 * @evidence contracts/development/design.md#principled-representation Normalized u,t bounds address the original interval while the restricted grid uses its own unit-square chart; error is in millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieLocalHermite64 creates leaves consumed by tessellation and per-triangle face attribution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The stored error is a binary64 evaluation of a Taylor estimate, not an outward-rounded certificate or source-fidelity measurement.
 * @evidence contracts/development/common.md#meaningful-documentation States grid parameterization, physical station conversion, estimate formula and patch identity scope.
 */
export type IAutoMoviePlanLocalHermite64Leaf = IAutoMovieLocalHermiteField64.Cell & {
  /** Lower normalized longitudinal coordinate in [0,1]; physical station is stations[j] + t0*(stations[j+1]-stations[j]). */
  t0: number;

  /** Upper normalized longitudinal coordinate, strictly greater than t0 and at most 1. */
  t1: number;

  /** Muu/8 + Mut/4 + Mtt/8 from this restricted grid's derivative-control norms, in millimetres. Retained leaves meet toleranceMm; zero is a pending-work placeholder before evaluation. */
  error: number;

  /** Name of the original common-partition cell, formed from run name, interval index and root-cell index; descendants share it while bounds distinguish their regions. */
  patch: string;
};
