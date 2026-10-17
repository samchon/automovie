import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

/**
 * Evaluate an admitted Bernstein piece at local t in [0,1], returning position in millimetres and its derivative per local t. De Casteljau evaluation preserves the supplied degree; rational coordinates use the quotient rule and hybrid Y uses its independent polynomial degree.
 *
 * @param piece Complete actual coefficient field; enclosing primitive admission supplies dense-array guarantees.
 * @param t Finite normalized local parameter, including both endpoints.
 * @throws Error for unsupported metadata, inconsistent cache, nonpositive denominator or unresolved arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Forward-difference derivative coefficients are evaluated by the same Bernstein recurrence; positive weights keep the supported denominator positive in exact arithmetic, and represented zero/nonfinite intermediate denominators are rejected.
 * @evidence contracts/common.md#clear-and-simple-design One evaluator handles polynomial, rational and rational-XZ/polynomial-Y branches without fitting or reducing their coefficient degree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional quotient caches are checked, not consumed as authority; explicit nonzero multiplication/division underflow is refused instead of returning a zero fallback. Binary64 cancellation and conditioning remain limitations.
 * @evidence contracts/common.md#meaningful-documentation Documents local derivative units, descriptive qInterval, independent hybrid Y and failure before a result is returned.
 * @evidence contracts/performance.md#efficient-algorithms For degree d and hybrid Y degree h, recurrence work is O(d²+h²), with O(d+h) temporary coefficient storage; endpoints avoid the interpolation recurrence.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One piece/t query coordinates no cross-call work, and mutable input coefficients are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Work arrays and returned vectors belong to this call; no coefficient, image or external handle is retained.
 */
export function evaluateAutoMovieBernstein64(
  piece: C.Piece,
  t: number,
): {
  /** Millimetre position after any rational and hybrid-Y evaluation. */
  point: C.Vector;

  /** Millimetres per normalized local t, before any enclosing phase-width division. */
  derivative: C.Vector;
} {
  const finite: (x: number) => number = (x: number): number => {
    if (typeof x !== "number" || !Number.isFinite(x))
      throw new Error("Nonfinite Bernstein arithmetic");
    return x;
  };
  const scalars: (a: readonly number[]) => readonly number[] = (
    a: readonly number[],
  ): readonly number[] => {
    if (!Array.isArray(a) || a.length === 0)
      throw new Error("Complete scalar coefficients required");
    for (const x of a) finite(x);
    return a;
  };
  const vectors: (a: readonly C.Vector[]) => readonly C.Vector[] = (
    a: readonly C.Vector[],
  ): readonly C.Vector[] => {
    if (!Array.isArray(a) || a.length === 0)
      throw new Error("Complete vector coefficients required");
    for (const p of a) {
      if (!Array.isArray(p) || p.length !== 3)
        throw new Error("Three-dimensional coefficients required");
      for (const x of p) finite(x);
    }
    return a;
  };
  if (
    !piece ||
    ![
      "polynomialBezier",
      "rationalBezier",
      "rationalXZPolynomialYBezier",
    ].includes(piece.primitive)
  )
    throw new Error("Unsupported Bernstein primitive");
  finite(t);
  if (t < 0 || t > 1 || !Number.isInteger(piece.degree) || piece.degree < 0)
    throw new Error("Invalid Bernstein degree or local parameter");
  const controls: readonly C.Vector[] = vectors(
    piece.primitive === "polynomialBezier"
      ? piece.controls
      : piece.homogeneousNumerator,
  );
  if (controls.length !== piece.degree + 1)
    throw new Error("Declared degree disagrees with complete coefficients");
  const metadata: C.Piece & {
    parameterDomain?: readonly number[];
    qInterval?: readonly number[];
    controls?: readonly C.Vector[];
  } = piece;
  if (
    metadata.parameterDomain !== undefined &&
    (!Array.isArray(metadata.parameterDomain) ||
      metadata.parameterDomain.length !== 2 ||
      metadata.parameterDomain[0] !== 0 ||
      metadata.parameterDomain[1] !== 1)
  )
    throw new Error("Only normalized local domain [0,1] is supported");
  if (
    metadata.qInterval !== undefined &&
    (!Array.isArray(metadata.qInterval) ||
      metadata.qInterval.length !== 2 ||
      !Number.isFinite(metadata.qInterval[0]) ||
      !Number.isFinite(metadata.qInterval[1]) ||
      metadata.qInterval[1]! <= metadata.qInterval[0]!)
  )
    throw new Error("Invalid physical course interval");
  if (piece.primitive !== "polynomialBezier") {
    const weights: readonly number[] = scalars(piece.weights);
    if (
      weights.length !== controls.length ||
      weights.some((x: number): boolean => x <= 0)
    )
      throw new Error("Complete positive Bernstein denominator required");
    if (metadata.controls !== undefined) {
      const cache: readonly C.Vector[] = vectors(metadata.controls);
      if (cache.length !== controls.length)
        throw new Error("Derived rational control cache count mismatch");
      for (let i: number = 0; i < controls.length; i++)
        for (let k: number = 0; k < 3; k++) {
          const actual: number = finite(controls[i]![k]! / weights[i]!);
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
  if (piece.primitive === "rationalXZPolynomialYBezier")
    scalars(piece.polynomialYControls);
  const casteljau: (a: readonly number[]) => number = (
    a: readonly number[],
  ): number => {
    if (t === 0) return a[0]!;
    if (t === 1) return a[a.length - 1]!;
    const work: number[] = [...a];
    for (let n: number = work.length - 1; n > 0; n--)
      for (let i: number = 0; i < n; i++)
        work[i] = finite(work[i]! + t * (work[i + 1]! - work[i]!));
    return work[0]!;
  };
  const difference: (a: readonly number[]) => number[] = (
    a: readonly number[],
  ): number[] =>
    a.length === 1
      ? [0]
      : a
          .slice(1)
          .map((x: number, i: number): number =>
            finite((a.length - 1) * (x - a[i]!)),
          );
  const product: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    const result: number = finite(a * b);
    if (a !== 0 && b !== 0 && result === 0)
      throw new Error("Unresolved product underflow");
    return result;
  };
  const quotient: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => {
    const result: number = finite(a / b);
    if (a !== 0 && result === 0)
      throw new Error("Unresolved quotient underflow");
    return result;
  };
  const p: number[] = [0, 1, 2].map((k: number): number =>
    casteljau(controls.map((c: C.Vector): number => c[k]!)),
  );
  const d: number[] = [0, 1, 2].map((k: number): number =>
    casteljau(difference(controls.map((c: C.Vector): number => c[k]!))),
  );
  if (piece.primitive !== "polynomialBezier") {
    const q: number = casteljau(piece.weights);
    const dq: number = casteljau(difference(piece.weights));
    if (!(q > 0)) throw new Error("Unresolved positive denominator");
    const square: number = product(q, q);
    if (!(square > 0))
      throw new Error("Unresolved positive derivative denominator square");
    for (let k: number = 0; k < 3; k++) {
      d[k] = quotient(finite(product(d[k]!, q) - product(p[k]!, dq)), square);
      p[k] = quotient(p[k]!, q);
    }
    if (piece.primitive === "rationalXZPolynomialYBezier") {
      p[1] = casteljau(piece.polynomialYControls);
      d[1] = casteljau(difference(piece.polynomialYControls));
    }
  }
  return {
    point: p as unknown as C.Vector,
    derivative: d as unknown as C.Vector,
  };
}
