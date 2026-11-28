import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  IAutoMovieBernsteinCurvePiece64,
  IAutoMovieCurvePrimitive64,
  IAutoMovieEvaluateBernstein64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Curve owners distinguish finite represented outputs, recoverable arithmetic
 * range and unrepresentable derivatives or cache quotients.
 *
 * A line keeps both endpoint values and its derivative. Scaled polynomial and
 * rational controls recover representable midpoint values. Interior seams
 * select the following span, and the final endpoint retains the last. Oval
 * positions and tangents use turns. Nonfinite local values, unsupported
 * arithmetic and independently malformed cache fields are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names endpoints and seams, scaled polynomial and rational arithmetic, oval units and explicit refusal classes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public piece and phase evaluators and whole-curve admission, with authored polynomial, rational and analytic inputs and malformed or unrepresentable variations.
 * @evidence contracts/development/testing.md#independent-expectations At t = 1/2 the relative quadratic controls 1,-1,1 give exact zero point and derivative. The rational field 2t/(1+t) gives 2/3 and 8/9 regardless of common homogeneous scale. The second straight span's phase width is 3/4, and an oval's quarter turn has tangent (-2*pi,0,0).
 */
export function test_engine_geometry_curve_numeric_admission(): void {
  const engine = AutoMovieEngineCurve;
  const piece: IAutoMovieBernsteinCurvePiece64 = {
    primitive: "polynomialBezier",
    degree: 1,
    controls: [
      [0, 0, 0],
      [1, 0, 0],
    ],
  };
  TestValidator.equals(
    "local endpoints, midpoint and derivative",
    [0, 0.5, 1].map((t) => engine.evaluateBernstein64(piece, t)),
    [0, 0.5, 1].map(
      (x): IAutoMovieEvaluateBernstein64.IResult => ({
        point: [x, 0, 0],
        derivative: [1, 0, 0],
      }),
    ),
  );
  const large: number = 1e308;
  TestValidator.equals(
    "polynomial cancellation is representable",
    engine.evaluateBernstein64(
      {
        ...piece,
        degree: 2,
        controls: [
          [large, 0, 0],
          [-large, 0, 0],
          [large, 0, 0],
        ],
      },
      0.5,
    ),
    { point: [0, 0, 0], derivative: [0, 0, 0] },
  );
  const rational = (scale: number): IAutoMovieBernsteinCurvePiece64 => ({
    primitive: "rationalBezier",
    degree: 1,
    homogeneousNumerator: [
      [0, 0, 0],
      [2 * scale, 0, 0],
    ],
    weights: [scale, 2 * scale],
    controls: [
      [0, 0, 0],
      [1, 0, 0],
    ],
  });
  const matchesRational = (
    result: IAutoMovieEvaluateBernstein64.IResult,
  ): boolean =>
    Math.abs(result.point[0] - 2 / 3) <= 1e-15 &&
    Math.abs(result.derivative[0] - 8 / 9) <= 1e-15;
  TestValidator.predicate(
    "common rational scale leaves the value and derivative",
    [1, 1e200].every((scale) =>
      matchesRational(engine.evaluateBernstein64(rational(scale), 0.5)),
    ),
  );
  const independentY = engine.evaluateBernstein64(
    {
      primitive: "rationalXZPolynomialYBezier",
      degree: 1,
      homogeneousNumerator: [
        [0, 0, 0],
        [2, 0, 0],
      ],
      weights: [1, 2],
      polynomialYControls: [0, 4, 0],
    },
    0.5,
  );
  TestValidator.predicate(
    "hybrid uses its independently ordered Y polynomial",
    matchesRational(independentY) &&
      independentY.point[1] === 2 &&
      independentY.derivative[1] === 0,
  );

  const line = {
    type: "bernstein",
    name: "line",
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    pieces: [piece],
  } satisfies IAutoMovieCurvePrimitive64;
  const seam = {
    ...line,
    phaseIntervals: [0.25, 0.75],
    pieces: [
      piece,
      {
        ...piece,
        controls: [
          [1, 0, 0],
          [1, 2, 0],
        ],
      },
    ],
  } satisfies IAutoMovieCurvePrimitive64;
  TestValidator.equals(
    "seam selects the following piece and final selects local one",
    [engine.evaluateCurve64(seam, 0.25), engine.evaluateCurve64(seam, 1)],
    [
      { point: [1, 0, 0], tangentPerParameter: [0, 2 / 0.75, 0] },
      { point: [1, 2, 0], tangentPerParameter: [0, 2 / 0.75, 0] },
    ],
  );
  const oval = {
    type: "analyticOval",
    name: "oval",
    closed: true,
    unit: "mm",
    phaseUnit: "turn",
    center: [0, 0, 0],
    u: [1, 0, 0],
    v: [0, 1, 0],
    radiusU: 1,
    radiusV: 1,
  } satisfies IAutoMovieCurvePrimitive64;
  const at = engine.evaluateCurve64(oval, 0.25);
  TestValidator.predicate(
    "oval position and derivative use turn phase",
    Math.abs(at.point[0]) <= 1e-15 &&
      at.point[1] === 1 &&
      Math.abs(at.tangentPerParameter[0] + 2 * Math.PI) <= 1e-15 &&
      Math.abs(at.tangentPerParameter[1]) <= 1e-15,
  );
  const contradictory: IAutoMovieBernsteinCurvePiece64 = {
    primitive: "rationalBezier",
    degree: 0,
    homogeneousNumerator: [[1, 0, 0]],
    weights: [Number.MIN_VALUE],
    controls: [[1, 0, 0]],
  };
  const bad: [string, () => unknown, string][] = [
    [
      "NaN local parameter",
      () => engine.evaluateBernstein64(piece, NaN),
      "local parameter",
    ],
    [
      "nonfinite control",
      () =>
        engine.evaluateBernstein64(
          {
            ...piece,
            controls: [
              [0, 0, 0],
              [1, 0, NaN],
            ],
          },
          0,
        ),
      "Finite Bernstein control triples",
    ],
    [
      "unrepresentable derivative",
      () =>
        engine.evaluateBernstein64(
          {
            ...piece,
            controls: [
              [-large, 0, 0],
              [large, 0, 0],
            ],
          },
          0.5,
        ),
      "point and derivative must remain finite",
    ],
    [
      "legacy unresolved denominator underflow",
      () => engine.evaluateBernstein64(rational(1e-200), 0.5),
      "Unresolved product underflow",
    ],
    [
      "unrepresentable piece cache",
      () => engine.evaluateBernstein64(contradictory, 0),
      "Unresolved rational cache quotient",
    ],
    [
      "unrepresentable curve cache",
      () => engine.assertCurve64({ ...line, pieces: [contradictory] }),
      "Unresolved rational cache quotient",
    ],
    [
      "NaN curve phase",
      () => engine.evaluateCurve64(line, NaN),
      "finite nonnegative curve parameter",
    ],
    [
      "NaN oval phase",
      () => engine.evaluateCurve64(oval, NaN),
      "finite nonnegative curve parameter",
    ],
    [
      "unrepresentable phase-scaled derivative",
      () =>
        engine.evaluateCurve64(
          {
            ...line,
            phaseIntervals: [Number.MIN_VALUE],
          },
          0,
        ),
      "tangent per parameter must remain finite",
    ],
    [
      "unrepresentable oval point",
      () =>
        engine.evaluateCurve64(
          {
            ...oval,
            center: [large, 0, 0],
            radiusU: large,
          },
          0,
        ),
      "oval point and tangent must remain finite",
    ],
  ];
  TestValidator.equals(
    "invalid input and unrepresentable output refusals",
    bad
      .filter(([, attempt, message]) => !throwsError(attempt, message))
      .map(([name]) => name),
    [],
  );
}
