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
  if (
    !Number.isFinite(t) ||
    t < 0 ||
    t > 1 ||
    !Number.isSafeInteger(piece.degree) ||
    piece.degree < 0
  )
    throw new Error("Invalid Bernstein degree or local parameter");
  if (
    piece.primitive !== "polynomialBezier" &&
    piece.primitive !== "rationalBezier" &&
    piece.primitive !== "rationalXZPolynomialYBezier"
  )
    throw new Error("Unsupported actual Bernstein primitive");
  const controls: readonly Readonly<AutoMovieVector3Tuple>[] =
    piece.primitive === "polynomialBezier"
      ? piece.controls
      : piece.homogeneousNumerator;
  if (!Array.isArray(controls) || controls.length !== piece.degree + 1)
    throw new Error("Declared degree disagrees with complete coefficients");
  for (const corner of controls)
    if (
      !Array.isArray(corner) ||
      corner.length !== 3 ||
      !Number.isFinite(corner[0]) ||
      !Number.isFinite(corner[1]) ||
      !Number.isFinite(corner[2])
    )
      throw new Error("Finite Bernstein control triples required");
  if (
    piece.parameterDomain !== undefined &&
    (!Array.isArray(piece.parameterDomain) ||
      piece.parameterDomain.length !== 2 ||
      piece.parameterDomain[0] !== 0 ||
      piece.parameterDomain[1] !== 1)
  )
    throw new Error("Only normalized local domain [0,1] is supported");
  if (
    piece.qInterval !== undefined &&
    (!Array.isArray(piece.qInterval) ||
      piece.qInterval.length !== 2 ||
      !Number.isFinite(piece.qInterval[0]) ||
      !Number.isFinite(piece.qInterval[1]) ||
      piece.qInterval[1] <= piece.qInterval[0])
  )
    throw new Error("Invalid physical course interval");
  if (piece.primitive !== "polynomialBezier") {
    const weights: readonly number[] = piece.weights;
    if (!Array.isArray(weights) || weights.length !== controls.length)
      throw new Error("Complete positive Bernstein denominator required");
    for (const weight of weights)
      if (!Number.isFinite(weight) || weight <= 0)
        throw new Error(
          "Complete positive finite Bernstein denominator required",
        );
    if (piece.controls !== undefined) {
      const cache: readonly Readonly<AutoMovieVector3Tuple>[] = piece.controls;
      if (!Array.isArray(cache) || cache.length !== controls.length)
        throw new Error("Derived rational control cache count mismatch");
      for (let i: number = 0; i < controls.length; i++) {
        if (!Array.isArray(cache[i]) || cache[i]!.length !== 3)
          throw new Error("Derived cache must contain finite control triples");
        for (let k: number = 0; k < 3; k++) {
          const numerator: number = controls[i]![k]!;
          const actual: number = numerator / weights[i]!;
          const alias: number = cache[i]![k]!;
          if (!Number.isFinite(actual) || (numerator !== 0 && actual === 0))
            throw new Error("Unresolved rational cache quotient");
          if (
            !Number.isFinite(alias) ||
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
  }
  if (piece.primitive === "rationalXZPolynomialYBezier") {
    if (
      !Array.isArray(piece.polynomialYControls) ||
      piece.polynomialYControls.length === 0
    )
      throw new Error("Complete scalar coefficients required");
    for (const coefficient of piece.polynomialYControls)
      if (!Number.isFinite(coefficient))
        throw new Error("Finite polynomial longitudinal coefficients required");
  }
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
  const sample = (
    coefficients: readonly number[],
  ): { point: number; derivative: number } => {
    const point: number = casteljau(coefficients);
    const derivative: number = casteljau(difference(coefficients));
    if (Number.isFinite(point) && Number.isFinite(derivative))
      return { point, derivative };
    // Both evaluation and differentiation are homogeneous in the
    // coefficients. Retry only arithmetic outside the ordinary range.
    let scale: number = 0;
    for (const coefficient of coefficients)
      scale = Math.max(scale, Math.abs(coefficient));
    const normalized: number[] = coefficients.map(
      (coefficient: number): number => coefficient / scale,
    );
    return {
      point: Number.isFinite(point) ? point : scale * casteljau(normalized),
      derivative: Number.isFinite(derivative)
        ? derivative
        : scale * casteljau(difference(normalized)),
    };
  };
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
  const p: AutoMovieVector3Tuple = [0, 0, 0];
  const d: AutoMovieVector3Tuple = [0, 0, 0];
  for (const k of [0, 1, 2] as const) {
    const coefficients: readonly number[] =
      k === 1 && piece.primitive === "rationalXZPolynomialYBezier"
        ? piece.polynomialYControls
        : controls.map(
            (control: Readonly<AutoMovieVector3Tuple>): number => control[k],
          );
    const evaluated = sample(coefficients);
    p[k] = evaluated.point;
    d[k] = evaluated.derivative;
  }
  if (piece.primitive !== "polynomialBezier") {
    const denominator = sample(piece.weights);
    const q: number = denominator.point;
    const dq: number = denominator.derivative;
    if (!Number.isFinite(q) || q <= 0)
      throw new Error("Unresolved positive denominator");
    const square: number = product(q, q);
    for (const k of [0, 1, 2] as const) {
      if (k === 1 && piece.primitive === "rationalXZPolynomialYBezier")
        continue;
      const point: number = quotient(p[k], q);
      const numerator: number = Number.isFinite(square)
        ? product(d[k], q) - product(p[k], dq)
        : Infinity;
      // Divide by the positive denominator before combining terms when
      // homogeneous products exceed their binary64 range.
      d[k] = Number.isFinite(numerator)
        ? quotient(numerator, square)
        : quotient(d[k], q) - product(point, quotient(dq, q));
      p[k] = point;
    }
  }
  if (!p.every(Number.isFinite) || !d.every(Number.isFinite))
    throw new Error("Bernstein point and derivative must remain finite");
  return { point: p, derivative: d };
}
