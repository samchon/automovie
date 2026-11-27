import type {
  AutoMovieVector3Tuple,
  IAutoMovieBernsteinCurvePiece64,
  IAutoMovieEvaluateBernstein64,
} from "@automovie/interface";

/*
 * Evaluate an admitted Bernstein piece at local t in [0,1], returning position
 * in millimetres and its derivative per local t. De Casteljau evaluation
 * preserves the supplied degree; rational coordinates use the quotient rule and
 * hybrid Y uses its independent polynomial degree.
 * Parameter piece: Complete actual coefficient field; enclosing primitive admission
 * supplies dense-array guarantees.
 * Parameter t: Normalized local parameter, including both endpoints.
 * Error for inconsistent degree, domain or cache, nonpositive
 * denominator or unresolved underflow.
 */
export function evaluateBernstein64(
  piece: IAutoMovieBernsteinCurvePiece64,
  t: number,
): IAutoMovieEvaluateBernstein64.IResult {
  if (t < 0 || t > 1 || piece.degree < 0)
    throw new Error("Invalid Bernstein degree or local parameter");
  const controls: readonly Readonly<AutoMovieVector3Tuple>[] =
    piece.primitive === "polynomialBezier"
      ? piece.controls
      : piece.homogeneousNumerator;
  if (controls.length !== piece.degree + 1)
    throw new Error("Declared degree disagrees with complete coefficients");
  if (
    piece.parameterDomain !== undefined &&
    (piece.parameterDomain[0] !== 0 || piece.parameterDomain[1] !== 1)
  )
    throw new Error("Only normalized local domain [0,1] is supported");
  if (
    piece.qInterval !== undefined &&
    piece.qInterval[1] <= piece.qInterval[0]
  )
    throw new Error("Invalid physical course interval");
  if (piece.primitive !== "polynomialBezier") {
    const weights: readonly number[] = piece.weights;
    if (
      weights.length !== controls.length ||
      weights.some((x: number): boolean => x <= 0)
    )
      throw new Error("Complete positive Bernstein denominator required");
    if (piece.controls !== undefined) {
      const cache: readonly Readonly<AutoMovieVector3Tuple>[] = piece.controls;
      if (cache.length !== controls.length)
        throw new Error("Derived rational control cache count mismatch");
      for (let i: number = 0; i < controls.length; i++)
        for (let k: number = 0; k < 3; k++) {
          const actual: number = controls[i]![k]! / weights[i]!;
          const alias: number = cache[i]![k]!;
          if (
            Math.abs(actual - alias) >
            32 *
              Number.EPSILON *
              Math.max(Math.abs(actual), Math.abs(alias), Number.MIN_VALUE)
          )
            throw new Error(
              "Derived cache contradicts actual numerator and denominator",
            );
        }
    }
  }
  if (
    piece.primitive === "rationalXZPolynomialYBezier" &&
    piece.polynomialYControls.length === 0
  )
    throw new Error("Complete scalar coefficients required");
  const casteljau: (a: readonly number[]) => number = (
    a: readonly number[],
  ): number => {
    if (t === 0) return a[0]!;
    if (t === 1) return a[a.length - 1]!;
    const work: number[] = [...a];
    for (let n: number = work.length - 1; n > 0; n--)
      for (let i: number = 0; i < n; i++)
        work[i] = work[i]! + t * (work[i + 1]! - work[i]!);
    return work[0]!;
  };
  const difference: (a: readonly number[]) => number[] = (
    a: readonly number[],
  ): number[] =>
    a.length === 1
      ? [0]
      : a
          .slice(1)
          .map((x: number, i: number): number => (a.length - 1) * (x - a[i]!));
  const product: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    const result: number = a * b;
    if (a !== 0 && b !== 0 && result === 0)
      throw new Error("Unresolved product underflow");
    return result;
  };
  const quotient: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    const result: number = a / b;
    if (a !== 0 && result === 0)
      throw new Error("Unresolved quotient underflow");
    return result;
  };
  const axis: (k: 0 | 1 | 2) => number[] = (k: 0 | 1 | 2): number[] =>
    controls.map((c: Readonly<AutoMovieVector3Tuple>): number => c[k]);
  const p: AutoMovieVector3Tuple = [
    casteljau(axis(0)),
    casteljau(axis(1)),
    casteljau(axis(2)),
  ];
  const d: AutoMovieVector3Tuple = [
    casteljau(difference(axis(0))),
    casteljau(difference(axis(1))),
    casteljau(difference(axis(2))),
  ];
  if (piece.primitive !== "polynomialBezier") {
    const q: number = casteljau(piece.weights);
    const dq: number = casteljau(difference(piece.weights));
    if (q <= 0) throw new Error("Unresolved positive denominator");
    const square: number = product(q, q);
    for (const k of [0, 1, 2] as const) {
      d[k] = quotient(product(d[k], q) - product(p[k], dq), square);
      p[k] = quotient(p[k], q);
    }
    if (piece.primitive === "rationalXZPolynomialYBezier") {
      p[1] = casteljau(piece.polynomialYControls);
      d[1] = casteljau(difference(piece.polynomialYControls));
    }
  }
  return { point: p, derivative: d };
}
