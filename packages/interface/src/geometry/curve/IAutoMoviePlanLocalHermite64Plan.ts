import type { IAutoMovieLocalHermiteField64 } from "./IAutoMovieLocalHermiteField64";
import type { IAutoMoviePlanLocalHermite64Leaf } from "./IAutoMoviePlanLocalHermite64Leaf";

/**
 * Root analytic cells and qualified retained leaves for one station interval.
 * Returned arrays belong to the caller; unrefined leaves may share their grid
 * objects with root cells, so treat the complete plan as immutable during emission.
 *
 * @evidence contracts/development/design.md#principled-representation Root cells cover the normalized course partition and leaves retain normalized subdomains with millimetre grids and estimates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Tessellation evaluates root cells while using leaves to form conforming parameter boundaries and error attribution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Resource or arithmetic refusal empties both arrays and records a reason; terminal lookahead also returns empty arrays but without a refusal.
 * @evidence contracts/development/common.md#meaningful-documentation Defines root-versus-leaf roles, shared grid lifetime and both meanings of an empty plan.
 */
export type IAutoMoviePlanLocalHermite64Plan = {
  /** Original common-partition analytic cells, in increasing u order, spanning the full station interval before adaptive subdivision. */
  cells: IAutoMovieLocalHermiteField64.Cell[];

  /** Ordered retained restrictions meeting toleranceMm; split parents are replaced by children. Empty when the interval is refused or lies beyond the final station interval. */
  leaves: IAutoMoviePlanLocalHermite64Leaf[];

  /** Resource-unprocessed or arithmetic-unprocessed explanation for an entirely discarded interval plan. Undefined also accompanies the expected empty terminal lookahead. */
  reason?: string;
};
