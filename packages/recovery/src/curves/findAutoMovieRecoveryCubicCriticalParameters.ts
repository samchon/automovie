import { rootsAutoMovieViewPolynomial } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieCubicCriticalParameters,
} from "@automovie/interface";

/**
 * Locate isolated cubic regularity and affine-curvature candidates analytically.
 *
 * For p(t)=a*t^3+b*t^2+c*t+d, D=cross(p',p'') is quadratic,
 * D=D0+e0*t+f*t^2/2 with e0=6*cross(c,a), f=12*cross(b,a).
 * Away from D=0, affine curvature has a stationary value only where e=D'=0
 * or 4*e^2-9*f*D=0. The existing engine polynomial-root owner evaluates these
 * source-coefficient polynomials; it does not fit observations or a point grid.
 * Roots of the two derivative components also identify stationary candidates.
 *
 * Input is a finite planar Bernstein control quadruple, in any fixed uniform
 * spatial unit. Translation and uniform edge normalization condition only the
 * root calculation: the supplied controls and source evaluator stay unchanged.
 * Results are numerical candidates in the open normalized interval, not exact
 * real roots or certified isolating intervals. Exactly identical values merge;
 * nearby distinct values remain separate. A constant polynomial has no isolated
 * roots. Zero-curvature values include inflections, repeated roots and stationary
 * points and do not themselves establish source regularity.
 */
export function findAutoMovieRecoveryCubicCriticalParameters(
  controls: readonly [
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
  ],
): IAutoMovieCubicCriticalParameters {
  if (controls.length !== 4)
    throw new RangeError(
      "Cubic critical parameters require four finite planar Bernstein controls.",
    );
  for (let i: number = 0; i < 4; ++i) {
    const p: Readonly<AutoMovieVector2Tuple> | undefined = controls[i];
    if (
      p === undefined ||
      !Array.isArray(p) ||
      p.length !== 2 ||
      !Number.isFinite(p[0]) ||
      !Number.isFinite(p[1])
    )
      throw new RangeError(
        "Cubic critical parameters require four finite planar Bernstein controls.",
      );
  }
  const raw: Readonly<AutoMovieVector2Tuple>[] = controls
    .slice(1)
    .map(
      (
        p: Readonly<AutoMovieVector2Tuple>,
        i: number,
      ): Readonly<AutoMovieVector2Tuple> => [
        p[0] - controls[i]![0],
        p[1] - controls[i]![1],
      ],
    );
  const scale: number = Math.max(
    ...raw.flatMap((p: Readonly<AutoMovieVector2Tuple>): number[] => [
      Math.abs(p[0]),
      Math.abs(p[1]),
    ]),
  );
  if (!Number.isFinite(scale))
    throw new RangeError(
      "Source control differences exceed finite binary64 arithmetic.",
    );
  if (scale === 0)
    return {
      breaks: [],
      zeroCurvature: [],
      affineCritical: [],
      stationary: [],
      collinear: true,
      diagnostics: [
        "Constant cubic: every parameter is stationary; no isolated critical parameters exist.",
      ],
    };
  const edges: Readonly<AutoMovieVector2Tuple>[] = raw.map(
    (p: Readonly<AutoMovieVector2Tuple>): Readonly<AutoMovieVector2Tuple> => [
      p[0] / scale,
      p[1] / scale,
    ],
  );
  const a: Readonly<AutoMovieVector2Tuple> = [
    edges[2]![0] - 2 * edges[1]![0] + edges[0]![0],
    edges[2]![1] - 2 * edges[1]![1] + edges[0]![1],
  ];
  const b: Readonly<AutoMovieVector2Tuple> = [
    3 * (edges[1]![0] - edges[0]![0]),
    3 * (edges[1]![1] - edges[0]![1]),
  ];
  const c: Readonly<AutoMovieVector2Tuple> = [
    3 * edges[0]![0],
    3 * edges[0]![1],
  ];
  const determinant: (
    x: Readonly<AutoMovieVector2Tuple>,
    y: Readonly<AutoMovieVector2Tuple>,
  ) => number = (
    x: Readonly<AutoMovieVector2Tuple>,
    y: Readonly<AutoMovieVector2Tuple>,
  ): number => x[0] * y[1] - x[1] * y[0];
  const d0: number = 2 * determinant(c, b);
  const e0: number = 6 * determinant(c, a);
  const f: number = 12 * determinant(b, a);
  const collinear: boolean = d0 === 0 && e0 === 0 && f === 0;
  const zeroCurvature: number[] = collinear
    ? []
    : rootsAutoMovieViewPolynomial([d0, e0, f / 2]);
  const affineCritical: number[] = collinear
    ? []
    : [
        ...new Set([
          ...rootsAutoMovieViewPolynomial([e0, f]),
          ...rootsAutoMovieViewPolynomial([
            4 * e0 * e0 - 9 * f * d0,
            -f * e0,
            (-f * f) / 2,
          ]),
        ]),
      ].sort((x: number, y: number): number => x - y);

  // A common velocity root is a regularity event even when D is identically
  // zero or touches zero without changing sign. Both components must agree.
  const vx: number[] = [c[0], 2 * b[0], 3 * a[0]];
  const vy: number[] = [c[1], 2 * b[1], 3 * a[1]];
  const primary: number[] = vx.some((v: number): boolean => v !== 0) ? vx : vy;
  const residual: (coefficients: number[], t: number) => number = (
    coefficients: number[],
    t: number,
  ): number => coefficients[0]! + t * (coefficients[1]! + t * coefficients[2]!);
  const allowance: (coefficients: number[], t: number) => number = (
    coefficients: number[],
    t: number,
  ): number =>
    64 *
    Number.EPSILON *
    (Math.abs(coefficients[0]!) +
      Math.abs(t * coefficients[1]!) +
      Math.abs(t * t * coefficients[2]!));
  const stationary: number[] = rootsAutoMovieViewPolynomial(primary).filter(
    (t: number): boolean =>
      Math.abs(residual(vx, t)) <= allowance(vx, t) &&
      Math.abs(residual(vy, t)) <= allowance(vy, t),
  );
  const diagnostics: string[] = [
    "Critical parameters are binary64 polynomial-root candidates, not certified real-root enclosures; close multiple roots may remain unresolved.",
  ];
  if (collinear)
    diagnostics.push(
      "Curvature numerator is identically zero: regular pieces are collinear and have no isolated curvature roots.",
    );
  if (!collinear && e0 === 0 && f === 0)
    diagnostics.push(
      "Affine curvature is constant on regular intervals; no isolated affine-curvature extrema exist.",
    );
  return {
    breaks: [
      ...new Set([...zeroCurvature, ...affineCritical, ...stationary]),
    ].sort((x: number, y: number): number => x - y),
    zeroCurvature,
    affineCritical,
    stationary,
    collinear,
    diagnostics,
  };
}
