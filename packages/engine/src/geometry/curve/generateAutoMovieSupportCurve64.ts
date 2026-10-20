import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";

/**
 * Generate a planar convex curve from a finite Fourier support function.
 * For the outward normal n=(cos(theta),sin(theta)) and tangent t=(-sin,cos),
 * X=h*n+h'*t and X'=(h+h'')*t. The support integral is the convex perimeter,
 * not the arclength of a nonconvex source outline. See Antunes and Bogosel,
 * https://arxiv.org/abs/1809.00254 . Coefficients and positions use millimetres.
 *
 * The returned polynomial Hermite curve approximates that analytic equation.
 * Its fourth-derivative remainder and positive-radius lower estimate are
 * numerical evaluations of analytic inequalities, not outward-rounded binary64
 * certificates. The polynomial's own perimeter is not silently equated to the
 * support integral. Refusal concerns this representation, not the source object.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates X=h*n+h'*t and its analytic tangent, then forms cubic Hermite controls on a fixed normal-angle partition; a Fourier derivative majorant bounds the mathematical interpolation remainder.
 * @evidence contracts/common.md#clear-and-simple-design One generic operation owns the support equation, convexity admission and explicit polynomial approximation; anatomical frames and fitted coefficients belong to its callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads no source mesh, specimen identity or expected shape and changes no supplied coefficient to force convexity or a smaller reported approximation error.
 * @evidence contracts/common.md#meaningful-documentation States units, angle parameter, support perimeter, finite work limits and the distinction between numerical estimates and outward certificates.
 * @evidence contracts/performance.md#efficient-algorithms For degree N, K cubic spans and S curvature samples, evaluation costs O(N*(K+S)); positive curvature uses successively doubled grids from 16 through 4096 samples, at most 8176 samples in total, and an analytic Lipschitz remainder.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each endpoint position and tangent in both incident Hermite spans and reuses harmonic amplitudes in both derivative majorants.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most 17 coefficient pairs and 4096 spans are admitted; local samples are discarded and only the generated curve and scalar qualifications transfer to the caller.
 */
export function generateAutoMovieSupportCurve64(props: {
  /** Caller-owned identity of the generated curve. */
  name: string;
  /** Coefficient pair at harmonic index n; index zero must have sine zero. */
  harmonics: readonly { cosine: number; sine: number }[];
  /** Fixed common normal-angle partition; a power of two in [4,4096]. */
  spans: number;
}): {
  /** Polynomial approximation in the local X/Z plane, phase in turns. */
  curve: C.Cubic;
  /** Integral of the analytic convex support function, millimetres. */
  analyticPerimeter: number;
  /** Estimated positive lower bound on h+h'', millimetres. */
  minimumRadiusLowerEstimate: number;
  /** Mathematical Hermite remainder evaluated in binary64, millimetres. */
  approximationErrorEstimate: number;
} {
  if (
    props.harmonics.length === 0 ||
    props.harmonics.length > 17 ||
    props.harmonics.some(
      (pair: { cosine: number; sine: number }): boolean =>
        !Number.isFinite(pair.cosine) || !Number.isFinite(pair.sine),
    ) ||
    props.harmonics[0]!.sine !== 0 ||
    !(props.harmonics[0]!.cosine > 0) ||
    !Number.isInteger(props.spans) ||
    props.spans < 4 ||
    props.spans > 4096 ||
    (props.spans & (props.spans - 1)) !== 0
  )
    throw new Error(
      "Finite millimetre support harmonics and a bounded power-of-two partition required",
    );
  const coefficients: { cosine: number; sine: number }[] = props.harmonics.map(
    (pair: {
      cosine: number;
      sine: number;
    }): { cosine: number; sine: number } => ({ ...pair }),
  );
  const perimeter: number = 2 * Math.PI * coefficients[0]!.cosine;
  if (!Number.isFinite(perimeter))
    throw new Error("Support-perimeter arithmetic overflow");
  let radiusLipschitz: number = 0;
  let fourthDerivativeBound: number = Math.abs(coefficients[0]!.cosine);
  for (let n: number = 1; n < coefficients.length; ++n) {
    const amplitude: number = Math.hypot(
      coefficients[n]!.cosine,
      coefficients[n]!.sine,
    );
    radiusLipschitz += n * Math.abs(1 - n * n) * amplitude;
    // In complex coordinates X=(h+i*h')*exp(i*theta), the two frequencies
    // contributed by harmonic n are n+1 and 1-n. Translation (n=1) vanishes.
    fourthDerivativeBound +=
      (amplitude / 2) *
      (Math.abs(1 - n) * (n + 1) ** 4 + (n + 1) * Math.abs(1 - n) ** 4);
  }
  const width: number = (2 * Math.PI) / props.spans;
  const error: number = (Math.SQRT2 * fourthDerivativeBound * width ** 4) / 384;
  if (!Number.isFinite(error))
    throw new Error("Support derivative-bound arithmetic overflow");
  let lower: number = -Infinity;
  for (let count: number = 16; count <= 4096; count *= 2) {
    let minimum: number = Infinity;
    for (let i: number = 0; i < count; ++i) {
      const angle: number = (2 * Math.PI * i) / count;
      let radius: number = coefficients[0]!.cosine;
      for (let n: number = 2; n < coefficients.length; ++n)
        radius +=
          (1 - n * n) *
          (coefficients[n]!.cosine * Math.cos(n * angle) +
            coefficients[n]!.sine * Math.sin(n * angle));
      minimum = Math.min(minimum, radius);
    }
    lower = minimum - (radiusLipschitz * Math.PI) / count;
    if (lower > 0) break;
  }
  if (!Number.isFinite(lower) || !(lower > 0))
    throw new Error(
      "Positive curvature radius remains unresolved for this support family",
    );
  const points: C.Vector[] = [];
  const tangents: C.Vector[] = [];
  for (let i: number = 0; i < props.spans; ++i) {
    const angle: number = width * i;
    let h: number = coefficients[0]!.cosine;
    let derivative: number = 0;
    let radius: number = h;
    for (let n: number = 1; n < coefficients.length; ++n) {
      const c: number = Math.cos(n * angle);
      const s: number = Math.sin(n * angle);
      const value: number =
        coefficients[n]!.cosine * c + coefficients[n]!.sine * s;
      h += value;
      derivative +=
        n * (-coefficients[n]!.cosine * s + coefficients[n]!.sine * c);
      radius += (1 - n * n) * value;
    }
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    points.push([h * c - derivative * s, 0, h * s + derivative * c]);
    tangents.push([-radius * s, 0, radius * c]);
  }
  const spans: C.Span[] = points.map((a: C.Vector, i: number): C.Span => {
    const next: number = (i + 1) % props.spans;
    const b: C.Vector = points[next]!;
    const da: C.Vector = tangents[i]!;
    const db: C.Vector = tangents[next]!;
    return [
      a,
      a.map(
        (x: number, k: number): number => x + (width * da[k]!) / 3,
      ) as unknown as C.Vector,
      b.map(
        (x: number, k: number): number => x - (width * db[k]!) / 3,
      ) as unknown as C.Vector,
      b,
    ];
  });
  if (
    spans.some((span: C.Span): boolean =>
      span.some((p: C.Vector): boolean => !p.every(Number.isFinite)),
    )
  )
    throw new Error("Support-curve arithmetic overflow");
  return {
    curve: {
      type: "cubicBezier",
      name: props.name,
      closed: true,
      unit: "mm",
      phaseUnit: "turn",
      phaseIntervals: Array.from(
        { length: props.spans },
        (): number => 1 / props.spans,
      ),
      spans,
    },
    analyticPerimeter: perimeter,
    minimumRadiusLowerEstimate: lower,
    approximationErrorEstimate: error,
  };
}
