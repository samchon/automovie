import type { IAutoMovieConstructionPortLoop } from "@automovie/interface";

/*
 * One original radial port-chart address in kernel mm and radians.
 *
 * The caller supplies the admitted loop, clock and radial share. Arithmetic
 * grouping is the existing PortCurve.chart law: (share*a)_cos(clock) and
 * ((share_sense)*b)*sin(clock). A mathematically equivalent regrouping can
 * cross a literal Float64 source-domain endpoint, so both operators and
 * numerical source constraints consume this function.
 */
export function AutoMovieConstructionPortAddress(
  loop: IAutoMovieConstructionPortLoop,
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
