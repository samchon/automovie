import type { IAutoMovieViewHermite } from "@automovie/interface";

import { adjacentFloat64 as adjacent } from "../../../math/internal/adjacentFloat64";

/*
 * Enclose the existing Hermite reader's first derivative on its knot span.
 *
 * The immutable preparation is the existing owner's actual binary64 xs, first
 * knot derivatives and quintic increment coefficients. Derivative units are per
 * selected source parameter, not a normalized station or world speed. Negative
 * bounds are valid; a consumer requiring positivity checks lower>0.
 *
 * Each real degree-four derivative numerator is converted to Bernstein form
 * with outward arithmetic. Its convex hull bounds every rounded local t in
 * [0,1]: monotonic subtraction/division keeps the reader's t in that interval.
 * The actual span h=xs[i+1]-xs[i] and every literal knot derivative are
 * included.
 *
 * The literal reader contains thirteen arithmetic operations after t is known,
 * including the left-associated (t_5)_c5 term. With u=EPSILON/2, eta=MIN_VALUE,
 * Q=sum(j_abs(cj),j=1..5), its additional error is bounded by gamma13_Q/h +
 * eta*((11+abs(c5))/h+1)/(1-13u). Eleven predivide errors have downstream
 * weight at most 1/h; the t*5 error has weight abs(c5)/h, and the final
 * division has weight one. This is separate from outward coefficient
 * conversion. The inflated prefix magnitude must also be finite, so an
 * overflowing proof returns a named refusal.
 *
 * This is a sufficient enclosure, not exact extrema or universal finite-input
 * support. It changes no evaluator, parameter, coefficient or input array.
 * Parameter curve: Immutable preparation produced by the existing Hermite owner.
 * Returns: Finite lower/upper derivative bounds, or a named
 * invalid/unrepresentable-proof refusal.
 */
export function viewHermiteDerivativeRange(
  curve: IAutoMovieViewHermite.ICurve,
): readonly [number, number] | string {
  let stage: string = "input";
  try {
    const n: number = curve.xs.length;
    if (
      n < 2 ||
      curve.first.length !== n ||
      curve.coefficients.length !== n - 1
    )
      throw new Error("inconsistent source dimensions");
    let lower: number = Infinity;
    let upper: number = -Infinity;
    for (const first of curve.first) {
      lower = Math.min(lower, first);
      upper = Math.max(upper, first);
    }
    const u: number = Number.EPSILON / 2;
    const denominator: number = 1 - 13 * u;
    const gamma: Interval = divide(point(13 * u), denominator);
    for (let i: number = 0; i + 1 < n; i++) {
      stage = "span " + i;
      const h: number = curve.xs[i + 1]! - curve.xs[i]!;
      if (!(h > 0))
        throw new Error("source interval is not finite and positive");
      const c: readonly number[] = curve.coefficients[i]!;
      if (c.length !== 5)
        throw new Error("quintic coefficients are not finite and complete");
      const d: Interval[] = [
        point(c[0]!),
        multiply(point(2), point(c[1]!)),
        multiply(point(3), point(c[2]!)),
        multiply(point(4), point(c[3]!)),
        multiply(point(5), point(c[4]!)),
      ];
      const controls: Interval[] = [
        d[0]!,
        add(d[0]!, divide(d[1]!, 4)),
        add(add(d[0]!, divide(d[1]!, 2)), divide(d[2]!, 6)),
        add(
          add(
            add(d[0]!, divide(multiply(point(3), d[1]!), 4)),
            divide(d[2]!, 2),
          ),
          divide(d[3]!, 4),
        ),
        add(add(add(add(d[0]!, d[1]!), d[2]!), d[3]!), d[4]!),
      ];
      let magnitude: Interval = point(0);
      for (const coefficient of d)
        magnitude = add(
          magnitude,
          point(Math.max(Math.abs(coefficient[0]), Math.abs(coefficient[1]))),
        );
      const weight: Interval = add(point(11), point(Math.abs(c[4]!)));
      const eta: Interval = point(Number.MIN_VALUE);

      // Finite inflated prefixes are a premise of the usual rounding model;
      // the separately bounded t*5 intermediate cannot overflow.
      divide(add(magnitude, multiply(eta, weight)), denominator);
      const error: number = add(
        divide(multiply(gamma, magnitude), h),
        divide(multiply(eta, add(divide(weight, h), point(1))), denominator),
      )[1];
      if (!(error >= 0)) throw new Error("negative reader allowance");
      const hull: Interval = divide(
        enclose(
          Math.min(...controls.map((control: Interval): number => control[0])),
          Math.max(...controls.map((control: Interval): number => control[1])),
        ),
        h,
      );
      const bounded: Interval = enclose(
        adjacent(hull[0] - error, false),
        adjacent(hull[1] + error, true),
      );
      lower = Math.min(lower, bounded[0]);
      upper = Math.max(upper, bounded[1]);
    }
    return enclose(lower, upper);
  } catch (error: unknown) {
    return (
      "Hermite derivative range " +
      stage +
      ": " +
      (error instanceof Error ? error.message : String(error))
    );
  }
}

/*
 * A closed outward binary64 enclosure; every endpoint must remain finite.
 */
type Interval = readonly [number, number];

/*
 * Admit a stored scalar without rounding or changing its signed value.
 */
function point(value: number): Interval {
  return enclose(value, value);
}

/*
 * A proof that reaches a nonfinite endpoint is unavailable, not unbounded.
 */
function enclose(lower: number, upper: number): Interval {
  if (!(lower <= upper))
    throw new Error("outward enclosure is not finitely representable");
  return [lower, upper];
}

/*
 * Round each exact interval sum outward by the existing adjacent-number owner.
 */
function add(a: Interval, b: Interval): Interval {
  return enclose(adjacent(a[0] + b[0], false), adjacent(a[1] + b[1], true));
}

/*
 * All four products cover arbitrary coefficient signs before outward rounding.
 */
function multiply(a: Interval, b: Interval): Interval {
  const products: number[] = [
    a[0] * b[0],
    a[0] * b[1],
    a[1] * b[0],
    a[1] * b[1],
  ];
  return enclose(
    adjacent(Math.min(...products), false),
    adjacent(Math.max(...products), true),
  );
}

/*
 * Every divisor is an actual positive span or a positive exact basis constant.
 */
function divide(a: Interval, positive: number): Interval {
  if (!(positive > 0))
    throw new Error("outward division needs a finite positive divisor");
  return enclose(
    adjacent(a[0] / positive, false),
    adjacent(a[1] / positive, true),
  );
}
