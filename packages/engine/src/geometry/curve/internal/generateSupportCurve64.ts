import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieGenerateSupportCurve64,
} from "@automovie/interface";

/*
 * Generate a planar convex curve from a finite Fourier support function. For
 * the outward normal n=(cos(theta),sin(theta)) and tangent t=(-sin,cos),
 * X=h*n+h'*t and X'=(h+h'')*t. The support integral is the convex perimeter,
 * not the arclength of a nonconvex source outline. See Antunes and Bogosel,
 * https://arxiv.org/abs/1809.00254 . Coefficients and positions use
 * millimetres.
 *
 * The returned polynomial Hermite curve approximates that analytic equation.
 * Its fourth-derivative remainder and positive-radius lower estimate are
 * numerical evaluations of analytic inequalities, not outward-rounded binary64
 * certificates. The polynomial's own perimeter is not silently equated to the
 * support integral. Refusal concerns this representation, not the source
 * object.
 */
export function generateSupportCurve64(
  props: IAutoMovieGenerateSupportCurve64.IProps,
): IAutoMovieGenerateSupportCurve64.IResult {
  if (
    props.harmonics.length === 0 ||
    props.harmonics.length > 17 ||
    props.harmonics[0]!.sine !== 0 ||
    props.harmonics[0]!.cosine <= 0 ||
    props.spans < 4 ||
    props.spans > 4096 ||
    (props.spans & (props.spans - 1)) !== 0
  )
    throw new Error(
      "Millimetre support harmonics and a bounded power-of-two partition required",
    );
  const coefficients: { cosine: number; sine: number }[] = props.harmonics.map(
    (pair: {
      cosine: number;
      sine: number;
    }): { cosine: number; sine: number } => ({ ...pair }),
  );
  const perimeter: number = 2 * Math.PI * coefficients[0]!.cosine;
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
  if (lower <= 0)
    throw new Error(
      "Positive curvature radius remains unresolved for this support family",
    );
  const points: Readonly<AutoMovieVector3Tuple>[] = [];
  const tangents: Readonly<AutoMovieVector3Tuple>[] = [];
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
  const spans: AutoMovieCubicBezierControls3[] = points.map(
    (
      a: Readonly<AutoMovieVector3Tuple>,
      i: number,
    ): AutoMovieCubicBezierControls3 => {
      const next: number = (i + 1) % props.spans;
      const b: Readonly<AutoMovieVector3Tuple> = points[next]!;
      const da: Readonly<AutoMovieVector3Tuple> = tangents[i]!;
      const db: Readonly<AutoMovieVector3Tuple> = tangents[next]!;
      return [
        a,
        [
          a[0] + (width * da[0]) / 3,
          a[1] + (width * da[1]) / 3,
          a[2] + (width * da[2]) / 3,
        ],
        [
          b[0] - (width * db[0]) / 3,
          b[1] - (width * db[1]) / 3,
          b[2] - (width * db[2]) / 3,
        ],
        b,
      ];
    },
  );
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
