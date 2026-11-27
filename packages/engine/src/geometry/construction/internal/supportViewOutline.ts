import type { IAutoMovieViewOutline } from "@automovie/interface";

import { AutoMovieEngineViewParameter } from "../../AutoMovieEngineViewParameter";
import { rootsViewPolynomial } from "./rootsViewPolynomial";
import { rootsViewSinPolynomial } from "./rootsViewSinPolynomial";

/*
 * Candidate support stations for the fixed-chart scalar function
 * slope_s+valueScale_outline(s).
 *
 * The domain is a closed subset of the original knot span; open extensions and
 * moving frames are excluded. Named knots and domain endpoints join the
 * analytic derivative-root candidates. A constant offset has no effect on these
 * stations. Identity/root source parameters give polynomial derivatives; the
 * two-pole angle gives P(theta)+slope_stationSpan/2_sin(theta), preserving its
 * actual trigonometric term. Critical roots are binary64 observations, not
 * certified interval enclosures or an exact extrema promise.
 * Parameter outline: Admitted original scalar source in kernel station units.
 * Parameter slope: Affine-origin coefficient, output units per station unit.
 * Parameter valueScale: Multiplier converting the original ordinate to output
 * units.
 * Parameter domain: Finite increasing closed subinterval of the original knot span.
 * Returns: Endpoints, included named knots and numerical interior critical
 * stations, or an explicit failure.
 */
export function supportViewOutline(
  outline: IAutoMovieViewOutline.IOutline,
  slope: number,
  valueScale: number,
  domain: readonly [number, number],
): number[] | string {
  if (
    domain.length !== 2 ||
    !(domain[0] < domain[1]) ||
    domain[0] < outline.domain[0] ||
    domain[1] > outline.domain[1]
  )
    return "affine source support needs finite coefficients and an increasing closed domain within its source knots";
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
    const interval: [number, number] = [
      Math.max(0, (start - x0) / h),
      Math.min(1, (end - x0) / h),
    ];
    const c: readonly number[] | undefined = outline.hermite?.coefficients[i];
    const polynomial: number[] =
      c === undefined
        ? [
            (ys[i + 1]! - ys[i]!) / h -
              (h * (2 * curvatures[i]! + curvatures[i + 1]!)) / 6,
            h * curvatures[i]!,
            (h * (curvatures[i + 1]! - curvatures[i]!)) / 2,
          ].map((value: number): number => valueScale * value)
        : c.map(
            (value: number, k: number): number =>
              (valueScale * (k + 1) * value) / h,
          );
    const p: IAutoMovieViewOutline.IOutline["parameter"] = outline.parameter;
    if (p === undefined) polynomial[0] = polynomial[0]! + slope;
    else if (p.type === "root") {
      const factor: number = (p.end === "bottom" ? 2 : -2) * slope;
      polynomial[0] = polynomial[0]! + factor * x0;
      polynomial[1] = polynomial[1]! + factor * h;
    }
    const roots: number[] | string =
      p?.type === "angle"
        ? rootsViewSinPolynomial(
            polynomial,
            x0,
            h,
            (slope * (p.top - p.bottom)) / 2,
            interval,
          )
        : rootsViewPolynomial(polynomial).filter(
            (t: number): boolean => t > interval[0] && t < interval[1],
          );
    if (typeof roots === "string")
      return `affine source support interval ${i}: ${roots}`;
    for (const t of roots) {
      const station: number = AutoMovieEngineViewParameter.station(p, x0 + h * t);
      if (station > domain[0] && station < domain[1]) result.push(station);
    }
  }
  return [...new Set(result)].sort((a: number, b: number): number => a - b);
}
