import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

/**
 * Reject malformed coefficient fields before evaluation or publication. Successful admission establishes finite dense represented data and a resolvable phase partition; it does not prove regularity, continuity, nonintersection or visibility.
 *
 * @param curve Complete caller-owned primitive; positions are millimetres.
 * @throws Error when representation, finiteness, phase partition or supported denominator conditions fail.
 *
 * @evidence contracts/common.md#principled-implementation Tag-specific admission checks dense coefficients, positive rational weights and strictly increasing binary64 cumulative phase widths; oval axes use the existing64-epsilon orthonormal tolerance.
 * @evidence contracts/common.md#clear-and-simple-design One assertion owns representation admission for both evaluation and boundary publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rational numerator/weights remain authoritative; an optional quotient cache is compared within 32 epsilons at its scalar magnitude, with no repaired coefficients or fitted replacement.
 * @evidence contracts/common.md#meaningful-documentation States admitted properties, unchanged input ownership, millimetre/phase conventions and limits of numerical validity.
 * @evidence contracts/performance.md#efficient-algorithms Linear in total coefficient count and phase widths; fixed-size oval checks are constant work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Caller coefficients can be mutable, so no cross-call admitted-object cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar locals and helper closures are allocated for one call; the input is neither cloned nor retained.
 */
export function assertAutoMovieCurve64(curve: C.Primitive): void {
  const dense: (
    a: unknown,
    count?: number,
  ) => asserts a is readonly unknown[] = (
    a: unknown,
    count?: number,
  ): asserts a is readonly unknown[] => {
    if (
      !Array.isArray(a) ||
      a.length === 0 ||
      (count !== undefined && a.length !== count)
    )
      throw new Error("Complete dense coefficients required");
    for (let i: number = 0; i < a.length; i++)
      if (!Object.hasOwn(a, i))
        throw new Error("Sparse coefficients are not a complete primitive");
  };
  const scalar: (x: unknown) => asserts x is number = (
    x: unknown,
  ): asserts x is number => {
    if (typeof x !== "number" || !Number.isFinite(x))
      throw new Error("Finite numeric coefficients required");
  };
  const vector: (v: unknown) => void = (v: unknown): void => {
    dense(v, 3);
    for (const x of v) scalar(x);
  };
  const vectors: (a: unknown, count: number) => void = (
    a: unknown,
    count: number,
  ): void => {
    dense(a, count);
    for (const v of a) vector(v);
  };
  if (
    !curve ||
    typeof curve.name !== "string" ||
    !curve.name ||
    typeof curve.closed !== "boolean" ||
    curve.unit !== "mm" ||
    !["turn", "mm", "normalized"].includes(curve.phaseUnit)
  )
    throw new Error("Explicit curve identity, topology and units required");
  if (curve.type === "analyticOval") {
    for (const v of [curve.center, curve.u, curve.v]) vector(v);
    scalar(curve.radiusU);
    scalar(curve.radiusV);
    if (
      curve.phaseUnit !== "turn" ||
      !curve.closed ||
      curve.radiusU <= 0 ||
      curve.radiusV <= 0
    )
      throw new Error("Invalid analytic oval");
    const dot: (a: C.Vector, b: C.Vector) => number = (
      a: C.Vector,
      b: C.Vector,
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
  const pieces: readonly (C.Span | C.Piece)[] =
    curve.type === "cubicBezier" ? curve.spans : curve.pieces;
  dense(pieces);
  dense(curve.phaseIntervals, pieces.length);
  let cumulative: number = 0;
  for (const width of curve.phaseIntervals) {
    scalar(width);
    const next: number = cumulative + width;
    if (width <= 0 || !Number.isFinite(next) || next <= cumulative)
      throw new Error("Unresolved parameter partition");
    cumulative = next;
  }
  if (curve.type === "cubicBezier") {
    for (const span of curve.spans) vectors(span, 4);
    return;
  }
  for (const piece of curve.pieces) {
    if (
      !piece ||
      ![
        "polynomialBezier",
        "rationalBezier",
        "rationalXZPolynomialYBezier",
      ].includes(piece.primitive) ||
      !Number.isSafeInteger(piece.degree) ||
      piece.degree < 0
    )
      throw new Error("Invalid actual Bernstein degree");
    const coefficients: readonly C.Vector[] =
      piece.primitive === "polynomialBezier"
        ? piece.controls
        : piece.homogeneousNumerator;
    vectors(coefficients, piece.degree + 1);
    if (piece.parameterDomain !== undefined) {
      dense(piece.parameterDomain, 2);
      if (piece.parameterDomain[0] !== 0 || piece.parameterDomain[1] !== 1)
        throw new Error("Only normalized local domain supported");
    }
    if (piece.qInterval !== undefined) {
      dense(piece.qInterval, 2);
      for (const x of piece.qInterval) scalar(x);
      if (!(piece.qInterval[1] > piece.qInterval[0]))
        throw new Error("Invalid course interval");
    }
    if (piece.primitive === "polynomialBezier") continue;
    dense(piece.weights, piece.degree + 1);
    for (const w of piece.weights) {
      scalar(w);
      if (w <= 0) throw new Error("Positive denominator coefficients required");
    }
    if (piece.controls !== undefined) {
      vectors(piece.controls, coefficients.length);
      for (let i: number = 0; i < coefficients.length; i++)
        for (let k: number = 0; k < 3; k++) {
          const quotient: number = coefficients[i]![k]! / piece.weights[i]!;
          scalar(quotient);
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
      for (const y of piece.polynomialYControls) scalar(y);
    }
  }
}
