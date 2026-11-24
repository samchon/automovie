import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoveryHermiteSpan,
  IAutoMovieVector3,
} from "@automovie/interface";
import { convertAutoMovieRecoveryCurve } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `convertAutoMovieRecoveryCurve` changes a cubic's basis over each span's
 * phase width h: the Hermite derivatives are 3(B1 − B0)/h and 3(B3 − B2)/h.
 *
 * The oracle is the polynomial p(s) = (s², s³, 2s) on s ∈ [0, 2], one span of
 * width 2. Its Bernstein controls in t = s/2 are B0 = (0,0,0), B1 = (0,0,4/3),
 * B2 = (4/3,0,8/3), B3 = (4,8,4), and its derivative p′(s) = (2s, 3s², 2) is
 * (0,0,2) at s = 0 and (4,12,2) at s = 2.
 *
 * Scenarios:
 *
 * 1. To Hermite: the ends are p(0) and p(2) and the derivatives p′(0), p′(2).
 * 2. Back to Bernstein: the original four controls.
 * 3. A zero phase width and a missing width refuse.
 */
export function test_unit_recovery_curves_convert_curve(): void {
  const bezier: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "polynomial",
    closed: false,
    unit: "mm",
    phaseUnit: "mm",
    phaseIntervals: [2],
    spans: [
      [
        [0, 0, 0],
        [0, 0, 4 / 3],
        [4 / 3, 0, 8 / 3],
        [4, 8, 4],
      ],
    ],
  };
  const v: (p: readonly number[]) => IAutoMovieVector3 = (
    p: readonly number[],
  ): IAutoMovieVector3 => ({
    x: p[0]!,
    y: p[1]!,
    z: p[2]!,
  });
  const hermite: IAutoMovieRecoveryHermiteCurve = convertAutoMovieRecoveryCurve(
    bezier,
    "hermite",
  );
  const span: IAutoMovieRecoveryHermiteSpan = hermite.spans[0]!;
  TestValidator.predicate(
    "the polynomial's ends and derivatives",
    hermite.type === "cubicHermite" &&
      hermite.name === "polynomial" &&
      vclose(v(span.start), v([0, 0, 0]), 1e-12) &&
      vclose(v(span.end), v([4, 8, 4]), 1e-12) &&
      vclose(v(span.startDerivative), v([0, 0, 2]), 1e-12) &&
      vclose(v(span.endDerivative), v([4, 12, 2]), 1e-12),
  );
  const back: IAutoMovieCubicBezierCurve64 = convertAutoMovieRecoveryCurve(
    hermite,
    "bezier",
  );
  TestValidator.predicate(
    "the original controls",
    back.spans[0]!.every((control: readonly number[], k: number): boolean =>
      vclose(v(control), v(bezier.spans[0]![k]!), 1e-12),
    ),
  );
  TestValidator.error("a zero phase width", (): unknown =>
    convertAutoMovieRecoveryCurve(
      { ...bezier, phaseIntervals: [0] },
      "hermite",
    ),
  );
  TestValidator.error("a missing phase width", (): unknown =>
    convertAutoMovieRecoveryCurve({ ...bezier, phaseIntervals: [] }, "hermite"),
  );
}
