import type { IAutoMovieViewOutline } from "@automovie/interface";

import { AutoMovieEngineViewParameter } from "../../AutoMovieEngineViewParameter";
import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";

/*
 * Numerical squared-distance candidates on an original scalar graph in a fixed
 * orthonormal chart.
 *
 * The caller supplies a fixed target (targetStation,targetValue), with both
 * coordinates and the source ordinate in the station's length unit. This is the
 * graph (s,r(s)); it does not interpret an affine/moving world origin or a
 * three-dimensional curve. The explicit finite closed interval must lie within
 * the original knots; a singleton returns its one endpoint. Angle parameters
 * and open extensions fail. Source endpoints, included named knots and
 * derivative-root candidates are returned, not an exact maximum, certified
 * enclosure or guarantee of separating ill-conditioned roots.
 * Returns: Sorted unique endpoint/knot/numerical critical stations, or a
 * premise/arithmetic failure string.
 */
export function distanceAutoMovieViewOutline(
  outline: IAutoMovieViewOutline.IOutline,
  targetStation: number,
  targetValue: number,
  domain: readonly [number, number],
): number[] | string {
  if (
    domain.length !== 2 ||
    domain[0] > domain[1] ||
    domain[0] < outline.domain[0] ||
    domain[1] > outline.domain[1]
  )
    return "source graph distance needs a finite target and closed domain within its source knots";
  if (outline.parameter?.type === "angle")
    return "source graph distance supports only station/root parameters in a fixed orthonormal chart, not angle, moving-frame or general three-dimensional curves";
  if (domain[0] === domain[1]) return [domain[0]];
  const { xs, ys, curvatures }: IAutoMovieViewOutline.IOutline["spline"] =
    outline.spline;
  const result: number[] = [
    domain[0],
    ...outline.knots
      .map(
        (k: IAutoMovieViewOutline.IOutline["knots"][number]): number =>
          k.station,
      )
      .filter((s: number): boolean => s > domain[0] && s < domain[1]),
    domain[1],
  ];
  const start: number = AutoMovieEngineViewParameter.at(outline.parameter, domain[0]);
  const end: number = AutoMovieEngineViewParameter.at(outline.parameter, domain[1]);
  for (let i: number = 0; i + 1 < xs.length; i++) {
    const x0: number = xs[i]!;
    const h: number = xs[i + 1]! - x0;
    if (x0 >= end || xs[i + 1]! <= start) continue;
    const p: IAutoMovieViewOutline.IOutline["parameter"] = outline.parameter;
    const sign: number = p?.type === "root" && p.end === "top" ? -1 : 1;
    const station: number[] =
      p === undefined
        ? [x0 - targetStation, h]
        : [
            p.pole + sign * x0 * x0 - targetStation,
            sign * 2 * x0 * h,
            sign * h * h,
          ];
    const ordinate: number[] = [
      ys[i]! - targetValue,
      ...(outline.hermite?.coefficients[i] ?? [
        h *
          ((ys[i + 1]! - ys[i]!) / h -
            (h * (2 * curvatures[i]! + curvatures[i + 1]!)) / 6),
        (h * h * curvatures[i]!) / 2,
        (h * h * (curvatures[i + 1]! - curvatures[i]!)) / 6,
      ]),
    ];

    // A common positive scale preserves distance stationarity while avoiding
    // overflow when the two coordinate polynomials are multiplied.
    const scale: number = Math.max(
      ...station.map(Math.abs),
      ...ordinate.map(Math.abs),
    );
    if (!(scale > 0))
      return `source graph distance interval ${i} has no representable displacement scale`;
    const rows: number[][] = [station, ordinate].map(
      (row: number[]): number[] => row.map((v: number): number => v / scale),
    );
    if (
      rows.some((row: number[], k: number): boolean =>
        row.some(
          (v: number, j: number): boolean =>
            v === 0 && [station, ordinate][k]![j] !== 0,
        ),
      )
    )
      return `source graph distance interval ${i} loses a displacement coefficient under normalization`;
    const polynomial: number[] = new Array<number>(
      2 * (Math.max(station.length, ordinate.length) - 1),
    ).fill(0);
    for (const row of rows)
      for (let a: number = 0; a < row.length; a++)
        for (let b: number = 1; b < row.length; b++) {
          const product: number = row[a]! * b * row[b]!;
          if (product === 0 && row[a] !== 0 && row[b] !== 0)
            return `source graph distance interval ${i} loses a derivative product under multiplication`;
          polynomial[a + b - 1] = polynomial[a + b - 1]! + product;
        }
    const lower: number = Math.max(0, (start - x0) / h);
    const upper: number = Math.min(1, (end - x0) / h);
    for (const t of rootsAutoMovieViewPolynomial(polynomial)) {
      if (!(t > lower && t < upper)) continue;
      const s: number = AutoMovieEngineViewParameter.station(p, x0 + h * t);
      if (s > domain[0] && s < domain[1]) result.push(s);
    }
  }
  return [...new Set(result)].sort((a: number, b: number): number => a - b);
}
