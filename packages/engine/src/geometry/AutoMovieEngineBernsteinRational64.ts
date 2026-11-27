import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieRationalBernsteinScalar64,
  IAutoMovieRationalBernsteinVector64,
} from "@automovie/interface";

import { AutoMovieEngineBernsteinAlgebra64 as B } from "./AutoMovieEngineBernsteinAlgebra64";
import { AutoMovieEngineBernsteinSubdivision64 as D } from "./AutoMovieEngineBernsteinSubdivision64";
import { AutoMovieEngineCurveMath64 as V } from "./AutoMovieEngineCurveMath64";

/**
 * Rational Bernstein quotients N/Q, including the four existing quotient
 * operations preserved by the AutoMovieEngineBernstein64 compatibility facade.
 * Aligned numerator/denominator partitioning, quotient derivatives and positive
 * scalar transitions retain the original coefficient arithmetic.
 *
 * Quotients require a positive evaluated denominator and reject otherwise; no
 * epsilon denominator or polynomial quotient fit replaces the homogeneous
 * representation.
 */
export namespace AutoMovieEngineBernsteinRational64 {
  /**
   * Partition numerator and denominator together so the rational quotient is
   * unchanged.
   */
  export function thirdsR(
    r: IAutoMovieRationalBernsteinVector64,
  ): IAutoMovieRationalBernsteinVector64[] {
    const ns: AutoMovieBernsteinPolynomial64[] = D.thirds(r.numerator),
      qs: number[][] = D.thirdsS(r.denominator);
    return ns.map(
      (
        n: AutoMovieBernsteinPolynomial64,
        i: number,
      ): IAutoMovieRationalBernsteinVector64 => ({
        numerator: n,
        denominator: qs[i]!,
      }),
    );
  }
  /** Evaluate N/Q or its quotient derivative; a nonpositive denominator rejects. */
  export function evaluateR(
    r: IAutoMovieRationalBernsteinVector64,
    t: number,
    derivative: boolean = false,
  ): AutoMovieVector3Tuple {
    const n: AutoMovieVector3Tuple = B.value(r.numerator, t),
      q: number = B.scalar(r.denominator, t);
    if (!(q > 0)) throw new Error("Nonpositive actual rational denominator");
    return derivative
      ? V.scale(
          V.sub(
            V.scale(B.value(B.tangent(r.numerator), t), q),
            V.scale(n, B.scalar(B.dScalar(r.denominator), t)),
          ),
          1 / (q * q),
        )
      : V.scale(n, 1 / q);
  }
  /**
   * Evaluate a scalar quotient or its derivative; a nonpositive denominator
   * rejects.
   */
  export function evaluateS(
    r: IAutoMovieRationalBernsteinScalar64,
    t: number,
    derivative: boolean = false,
  ): number {
    const n: number = B.scalar(r.numerator, t),
      q: number = B.scalar(r.denominator, t);
    if (!(q > 0)) throw new Error("Nonpositive scalar denominator");
    return derivative
      ? (B.scalar(B.dScalar(r.numerator), t) * q -
          n * B.scalar(B.dScalar(r.denominator), t)) /
          (q * q)
      : n / q;
  }
  /**
   * Construct a control-positive rational transition with the supplied endpoint
   * values and slopes.
   */
  export function positiveScalar(
    a: number,
    b: number,
    da: number,
    db: number,
  ): IAutoMovieRationalBernsteinScalar64 {
    if (!(a > 0 && b > 0))
      throw new Error("Positive transition endpoints required");
    const p: number = da > 0 ? 2 * a : da < 0 ? a / 2 : a,
      q: number = db > 0 ? b / 2 : db < 0 ? 2 * b : b;
    const weights: number[] = [
      1,
      da ? da / (3 * (p - a)) : 1,
      db ? db / (3 * (b - q)) : 1,
      1,
    ];
    return {
      numerator: [a, p, q, b].map(
        (v: number, i: number): number => v * weights[i]!,
      ),
      denominator: weights,
    };
  }
}
