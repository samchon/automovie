import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieBernsteinCurvePiece64,
  IAutoMovieCurvePrimitive64,
} from "@automovie/interface";

/*
 * Reject malformed coefficient fields before evaluation or publication.
 * Successful admission establishes finite dense represented data and a
 * resolvable phase partition; it does not prove regularity, continuity,
 * nonintersection or visibility.
 * Parameter curve: Complete caller-owned primitive; positions are millimetres.
 * Error when representation, finiteness, phase partition or supported
 * denominator conditions fail.
 */
export function assertAutoMovieCurve64(
  curve: IAutoMovieCurvePrimitive64,
): void {
  const dense: (a: readonly unknown[], count?: number) => void = (
    a: readonly unknown[],
    count?: number,
  ): void => {
    if (a.length === 0 || (count !== undefined && a.length !== count))
      throw new Error("Complete dense coefficients required");
    for (let i: number = 0; i < a.length; i++)
      if (!Object.hasOwn(a, i))
        throw new Error("Sparse coefficients are not a complete primitive");
  };
  const vector: (v: readonly number[]) => void = (v: readonly number[]): void => {
    dense(v, 3);
    if (v.some((x: number): boolean => !Number.isFinite(x)))
      throw new Error("Finite curve coefficients required");
  };
  const vectors: (a: readonly (readonly number[])[], count: number) => void = (
    a: readonly (readonly number[])[],
    count: number,
  ): void => {
    dense(a, count);
    for (const v of a) vector(v);
  };
  if (
    !curve.name.trim() ||
    curve.unit !== "mm" ||
    !["turn", "mm", "normalized"].includes(curve.phaseUnit)
  )
    throw new Error("Explicit curve identity, topology and units required");
  if (curve.type === "analyticOval") {
    for (const v of [curve.center, curve.u, curve.v]) vector(v);
    if (
      curve.phaseUnit !== "turn" ||
      !curve.closed ||
      !(curve.radiusU > 0) ||
      !(curve.radiusV > 0) ||
      !Number.isFinite(curve.radiusU) ||
      !Number.isFinite(curve.radiusV)
    )
      throw new Error("Invalid analytic oval");
    const dot: (
      a: Readonly<AutoMovieVector3Tuple>,
      b: Readonly<AutoMovieVector3Tuple>,
    ) => number = (
      a: Readonly<AutoMovieVector3Tuple>,
      b: Readonly<AutoMovieVector3Tuple>,
    ): number =>
      a.reduce((s: number, x: number, i: number): number => s + x * b[i]!, 0);
    if (
      Math.abs(dot(curve.u, curve.u) - 1) > 64 * Number.EPSILON ||
      Math.abs(dot(curve.v, curve.v) - 1) > 64 * Number.EPSILON ||
      Math.abs(dot(curve.u, curve.v)) > 64 * Number.EPSILON
    )
      throw new Error("Orthonormal oval axes required");
    return;
  }
  if (curve.type !== "cubicBezier" && curve.type !== "bernstein")
    throw new Error("Unsupported actual primitive");
  const pieces: readonly (
    | AutoMovieCubicBezierControls3
    | IAutoMovieBernsteinCurvePiece64
  )[] = curve.type === "cubicBezier" ? curve.spans : curve.pieces;
  dense(pieces);
  dense(curve.phaseIntervals, pieces.length);
  let cumulative: number = 0;
  for (const width of curve.phaseIntervals) {
    const next: number = cumulative + width;
    if (!(width > 0) || !Number.isFinite(width) || !Number.isFinite(next) || next <= cumulative)
      throw new Error("Unresolved parameter partition");
    cumulative = next;
  }
  if (curve.type === "cubicBezier") {
    for (const span of curve.spans) vectors(span, 4);
    return;
  }
  for (const piece of curve.pieces) {
    if (
      ![
        "polynomialBezier",
        "rationalBezier",
        "rationalXZPolynomialYBezier",
      ].includes(piece.primitive) ||
      piece.degree < 0
    )
      throw new Error("Invalid actual Bernstein degree");
    const coefficients: readonly Readonly<AutoMovieVector3Tuple>[] =
      piece.primitive === "polynomialBezier"
        ? piece.controls
        : piece.homogeneousNumerator;
    vectors(coefficients, piece.degree + 1);
    if (piece.parameterDomain !== undefined) {
      dense(piece.parameterDomain, 2);
      if (
        piece.parameterDomain.some((x: number): boolean => !Number.isFinite(x)) ||
        piece.parameterDomain[0] !== 0 ||
        piece.parameterDomain[1] !== 1
      )
        throw new Error("Only normalized local domain supported");
    }
    if (piece.qInterval !== undefined) {
      dense(piece.qInterval, 2);
      if (
        piece.qInterval.some((x: number): boolean => !Number.isFinite(x)) ||
        !(piece.qInterval[1] > piece.qInterval[0])
      )
        throw new Error("Invalid course interval");
    }
    if (piece.primitive === "polynomialBezier") continue;
    dense(piece.weights, piece.degree + 1);
    for (const w of piece.weights) {
      if (!(w > 0) || !Number.isFinite(w))
        throw new Error("Positive finite denominator coefficients required");
    }
    if (piece.controls !== undefined) {
      vectors(piece.controls, coefficients.length);
      for (let i: number = 0; i < coefficients.length; i++)
        for (let k: number = 0; k < 3; k++) {
          const quotient: number = coefficients[i]![k]! / piece.weights[i]!;
          if (coefficients[i]![k] !== 0 && quotient === 0)
            throw new Error("Unresolved rational cache quotient");
          const alias: number = piece.controls[i]![k]!;
          if (
            Math.abs(quotient - alias) >
            32 *
              Number.EPSILON *
              Math.max(Math.abs(quotient), Math.abs(alias), Number.MIN_VALUE)
          )
            throw new Error("Contradictory derived cache");
        }
    }
    if (piece.primitive === "rationalXZPolynomialYBezier") {
      dense(piece.polynomialYControls);
      if (piece.polynomialYControls.some((x: number): boolean => !Number.isFinite(x)))
        throw new Error("Finite polynomial longitudinal coefficients required");
    }
  }
}
