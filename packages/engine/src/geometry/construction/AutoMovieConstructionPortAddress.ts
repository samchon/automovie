import type { IAutoMovieConstructionPort } from "@automovie/interface";

/**
 * One original radial port-chart address in kernel mm and radians.
 *
 * The caller supplies the admitted loop, clock and radial share. Arithmetic
 * grouping is the existing PortCurve.chart law: (share*a)*cos(clock) and
 * ((share*sense)*b)*sin(clock). A mathematically equivalent regrouping can
 * cross a literal Float64 source-domain endpoint, so both operators and
 * numerical source constraints consume this function.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Mechanically extracts the existing operator's point formula with its original conversions and left-to-right products.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure point evaluation replaces the duplicated chart arithmetic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Contains no clamp, tolerance, inverse, solver, replacement datum or source evaluation; caller admission remains at its existing owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and one newly owned coordinate pair.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work PortCurve and native source-level construction use the same literal law instead of independently regrouping it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no loop, frame, source or cache after return.
 * @evidence contracts/development/common.md#meaningful-documentation States public metres/radians input, kernel mm/radians output, caller admission and the reason the product order is binding.
 */
export function AutoMovieConstructionPortAddress(
  loop: IAutoMovieConstructionPort.ILoop,
  clock: number,
  share: number,
): [number, number] {
  const y0: number = loop.centre[0] * 1000;
  const p0: number = loop.centre[1];
  const a: number = loop.semi[0] * 1000;
  const b: number = loop.semi[1];
  return [
    y0 + share * a * Math.cos(clock),
    p0 + share * loop.sense * b * Math.sin(clock),
  ];
}
