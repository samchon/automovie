import type {
  IAutoMovieConstructionOutlineRange,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewHermite,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE } from "./AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE";
import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";

/**
 * Explicit C2 source jets and sufficient scalar-range filtering of shared
 * quintic Hermite knot jets.
 */
export namespace AutoMovieViewHermite {
  /**
   * Admit requested normalized source jets and an optional sufficient scalar
   * hull bound.
   */
  export function create(
    spline: IAutoMovieNaturalCubicSpline,
    knots: readonly IAutoMovieViewPart.IKnot[],
    range: IAutoMovieConstructionOutlineRange | undefined,
  ): IAutoMovieViewHermite.ICurve | string {
    const { xs, ys, curvatures }: IAutoMovieNaturalCubicSpline = spline;
    const n: number = xs.length;
    const span: number = xs[n - 1]! - xs[0]!;
    const first: number[] = [];
    const second: number[] = [];
    if (!(span > 0))
      return "normalized source jets need a positive whole parameter span";
    if (
      range !== undefined &&
      range.minimum !== null &&
      range.maximum !== null &&
      range.minimum > range.maximum
    )
      return "source range needs ordered bounds or null unbounded sides";
    const minimum: number = range?.minimum ?? -Infinity;
    const maximum: number = range?.maximum ?? Infinity;
    const allowance: number =
      AUTOMOVIE_CONSTRUCTION_RELATIVE_TOLERANCE *
      Math.max(
        ...ys.map(Math.abs),
        ...[minimum, maximum]
          .filter((bound: number): boolean => Math.abs(bound) !== Infinity)
          .map(Math.abs),
      );
    for (let i: number = 0; i < n; i++) {
      if (ys[i]! < minimum - allowance || ys[i]! > maximum + allowance)
        return `source knot ${knots[i]!.site}=${ys[i]} is outside its declared range [${minimum}, ${maximum}]`;
      const k: number = i + 1 < n ? i : i - 1;
      const h: number = xs[k + 1]! - xs[k]!;
      const natural: number =
        (ys[k + 1]! - ys[k]!) / h -
        (h * (2 * curvatures[k]! + curvatures[k + 1]!)) / 6 +
        (i + 1 < n ? 0 : (h * (curvatures[k]! + curvatures[k + 1]!)) / 2);
      const jet: IAutoMovieViewPart.IKnot["jet"] = knots[i]!.jet;
      first.push(
        jet?.first === null || jet?.first === undefined
          ? natural
          : jet.first / span,
      );
      second.push(
        jet?.second === null || jet?.second === undefined
          ? curvatures[i]!
          : jet.second / span / span,
      );
    }
    for (let i: number = 0; range !== undefined && i < n; i++) {
      const displacement: number[] = [];
      for (const sign of [-1, 1]) {
        const neighbour: number = i + sign;
        if (neighbour < 0 || neighbour >= n) continue;
        const h: number = Math.abs(xs[neighbour]! - xs[i]!);
        displacement.push(
          (sign * h * first[i]!) / 5,
          (sign * 2 * h * first[i]!) / 5 + (h * (h * second[i]!)) / 20,
        );
      }
      const authored: boolean =
        knots[i]!.jet !== undefined &&
        (knots[i]!.jet!.first !== null || knots[i]!.jet!.second !== null);
      let factor: number = 1;
      for (const d of displacement)
        factor = Math.min(
          factor,
          d > 0 ? (maximum - ys[i]!) / d : d < 0 ? (minimum - ys[i]!) / d : 1,
        );
      if (authored && factor < 1)
        return `source knot ${knots[i]!.site}: authored jet has no admitted range control hull; this sufficient hull refusal does not prove an actual curve violation`;

      // The parameter jets are multiplied before the control arithmetic;
      // recheck that actual arithmetic rather than assuming associativity.
      const inside: (f: number) => boolean = (f: number): boolean => {
        for (const sign of [-1, 1]) {
          const neighbour: number = i + sign;
          if (neighbour < 0 || neighbour >= n) continue;
          const h: number = Math.abs(xs[neighbour]! - xs[i]!);
          const m: number = first[i]! * f;
          const a: number = second[i]! * f;
          const controls: number[] = [
            ys[i]! + (sign * h * m) / 5,
            ys[i]! + (sign * 2 * h * m) / 5 + (h * (h * a)) / 20,
          ];
          if (
            !controls.every(
              (v: number): boolean => v >= minimum && v <= maximum,
            )
          )
            return false;
        }
        return true;
      };
      for (
        let step: number = 0;
        !authored && !inside(factor) && step < 64;
        step++
      )
        factor = lower(factor);
      if (!inside(factor))
        return `source knot ${knots[i]!.site}: parameter jets have no representable in-range control hull within 64 inward binary64 steps`;
      first[i] = first[i]! * factor;
      second[i] = second[i]! * factor;
    }
    const coefficients: number[][] = [];
    for (let i: number = 0; i + 1 < n; i++) {
      const h: number = xs[i + 1]! - xs[i]!;
      const c1: number = h * first[i]!;
      const c2: number = (h * (h * second[i]!)) / 2;
      const a: number = ys[i + 1]! - ys[i]! - c1 - c2;
      const b: number = h * first[i + 1]! - c1 - 2 * c2;
      const c: number = h * (h * second[i + 1]!) - 2 * c2;
      const polynomial: number[] = [
        c1,
        c2,
        10 * a - 4 * b + c / 2,
        -15 * a + 7 * b - c,
        6 * a - 3 * b + c / 2,
      ];
      coefficients.push(polynomial);
    }
    return { xs, ys, first, second, coefficients };
  }

  /** Scalar value, with the endpoint tangent beyond the closed source knot span. */
  export function value(
    curve: IAutoMovieViewHermite.ICurve,
    x: number,
  ): number {
    const last: number = curve.xs.length - 1;
    if (x <= curve.xs[0]!)
      return curve.ys[0]! + (x - curve.xs[0]!) * curve.first[0]!;
    if (x >= curve.xs[last]!)
      return curve.ys[last]! + (x - curve.xs[last]!) * curve.first[last]!;
    const k: number = interval(curve.xs, x);
    if (x === curve.xs[k]!) return curve.ys[k]!;
    const t: number = (x - curve.xs[k]!) / (curve.xs[k + 1]! - curve.xs[k]!);
    const c: readonly number[] = curve.coefficients[k]!;
    return (
      curve.ys[k]! +
      t * (c[0]! + t * (c[1]! + t * (c[2]! + t * (c[3]! + t * c[4]!))))
    );
  }

  /** First/second derivatives in the selected source parameter. */
  export function derivative(
    curve: IAutoMovieViewHermite.ICurve,
    x: number,
  ): [number, number] {
    const last: number = curve.xs.length - 1;
    if (x < curve.xs[0]!) return [curve.first[0]!, 0];
    if (x > curve.xs[last]!) return [curve.first[last]!, 0];
    const k: number = interval(curve.xs, x);
    if (x === curve.xs[k]!) return [curve.first[k]!, curve.second[k]!];
    if (x === curve.xs[last]!) return [curve.first[last]!, curve.second[last]!];
    const h: number = curve.xs[k + 1]! - curve.xs[k]!;
    const t: number = (x - curve.xs[k]!) / h;
    const c: readonly number[] = curve.coefficients[k]!;
    return [
      (c[0]! +
        t * (2 * c[1]! + t * (3 * c[2]! + t * (4 * c[3]! + t * 5 * c[4]!)))) /
        h,
      (2 * c[1]! + t * (6 * c[2]! + t * (12 * c[3]! + t * 20 * c[4]!))) / h / h,
    ];
  }

  /** Value and both parameter derivatives from one selected original span. */
  export function read(
    curve: IAutoMovieViewHermite.ICurve,
    x: number,
  ): [number, number, number] {
    const last: number = curve.xs.length - 1;
    if (x <= curve.xs[0]!)
      return [
        curve.ys[0]! + (x - curve.xs[0]!) * curve.first[0]!,
        curve.first[0]!,
        x < curve.xs[0]! ? 0 : curve.second[0]!,
      ];
    if (x >= curve.xs[last]!)
      return [
        curve.ys[last]! + (x - curve.xs[last]!) * curve.first[last]!,
        curve.first[last]!,
        x > curve.xs[last]! ? 0 : curve.second[last]!,
      ];
    const k: number = interval(curve.xs, x);
    if (x === curve.xs[k]!)
      return [curve.ys[k]!, curve.first[k]!, curve.second[k]!];
    const h: number = curve.xs[k + 1]! - curve.xs[k]!;
    const t: number = (x - curve.xs[k]!) / h;
    const c: readonly number[] = curve.coefficients[k]!;
    return [
      curve.ys[k]! +
        t * (c[0]! + t * (c[1]! + t * (c[2]! + t * (c[3]! + t * c[4]!)))),
      (c[0]! +
        t * (2 * c[1]! + t * (3 * c[2]! + t * (4 * c[3]! + t * 5 * c[4]!)))) /
        h,
      (2 * c[1]! + t * (6 * c[2]! + t * (12 * c[3]! + t * 20 * c[4]!))) / h / h,
    ];
  }

  /** Additional isolated zero-slope parameters strictly inside each source span. */
  export function critical(curve: IAutoMovieViewHermite.ICurve): number[] {
    return curve.coefficients.flatMap(
      (c: readonly number[], i: number): number[] => {
        const scale: number = Math.max(...c.map(Math.abs));
        return scale === 0
          ? []
          : rootsAutoMovieViewPolynomial(
              c.map((v: number, j: number): number => (j + 1) * (v / scale)),
            ).map(
              (t: number): number =>
                curve.xs[i]! + t * (curve.xs[i + 1]! - curve.xs[i]!),
            );
      },
    );
  }

  /**
   * Binary search in an admitted increasing knot list; outside queries use an
   * end interval. No query state survives.
   */
  function interval(xs: readonly number[], x: number): number {
    let lo: number = 0;
    let hi: number = xs.length - 1;
    while (hi - lo > 1) {
      const middle: number = (lo + hi) >> 1;
      if (xs[middle]! <= x) lo = middle;
      else hi = middle;
    }
    return lo;
  }

  /**
   * The adjacent smaller nonnegative binary64 factor; an eight-byte local view
   * is released immediately and no scalar ordinate is changed.
   */
  function lower(factor: number): number {
    if (factor === 0) return 0;
    const bits: DataView = new DataView(new ArrayBuffer(8));
    bits.setFloat64(0, factor, false);
    bits.setBigUint64(0, bits.getBigUint64(0, false) - 1n, false);
    return bits.getFloat64(0, false);
  }
}
