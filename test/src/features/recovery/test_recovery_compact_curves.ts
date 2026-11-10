import { TestValidator } from "@nestia/e2e";

import { AutoMovieRecoveryCompactApproximation as C } from "../../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import { AutoMovieRecoveryConicApproximation as Q } from "../../../../packages/recovery/src/curves/AutoMovieRecoveryConicApproximation";
import { approximateAutoMovieRecoveryCompactCurves as approximate } from "../../../../packages/recovery/src/curves/approximateAutoMovieRecoveryCompactCurves";
import { nclose } from "../internal/nclose";

/**
 * Verify coefficient compression independently of any private specimen.
 *
 * Scenarios:
 * 1. Sixteen smooth cubic source pieces collapse to one affine-transformed cubic.
 * 2. A fifth-degree source fits one quintic while a one-piece cubic cannot meet tolerance.
 * 3. Mixed quarter conics reproduce a full analytic ellipse using four pieces.
 * 4. A true corner survives and cannot be crossed by a fitted piece.
 * 5. A nonconic exponential has independent dense bidirectional geometric checks.
 * 6. Repetition is deterministic, input arrays remain unchanged and malformed or exhausted budgets remain explicit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists six representation, fidelity and admission scenarios, including real across-knot compression and independent geometric expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Executes pure fitting and evaluates returned coefficients; verifies source coverage, degree choice, genuine piece reduction, hard corners, statuses and explicit limitations.
 * @evidence contracts/development/testing.md#independent-expectations Analytic cubic, quintic, ellipse and exponential formulas define targets; dense 137-node paired witnesses bound nearest distance in both directions without reusing fitting nodes or SVD coefficients.
 * @evidence contracts/development/testing.md#distinguishing-cases Low and high degree, an analytic conic, a real corner, affine translation, a nonpolynomial curve and insufficient budgets distinguish legitimate compression from elevation, smoothing and silent omission.
 * @evidence contracts/development/testing.md#execution-ownership The central runner discovers one portable synchronous CPU-only function with no files, native reference, renderer, process or compiler.
 */
export function test_recovery_compact_curves(): void {
  const options: C.IOptions = { toleranceMm: 1e-4, degree: 3, maximumPieces: 128, maximumDepth: 12, maximumQueries: 100000 };
  const knots: number[] = Array.from({ length: 15 }, (_v: unknown, i: number): number => (i + 1) / 16);
  const cubic: C.ICurve = {
    domain: [0, 1], knots, breaks: [], closed: false,
    evaluate(t: number): Q.Point {
      const y: number = t * t + 0.1 * t ** 3;
      return [250 + 3 * t + 2 * y, -400 - t + 4 * y];
    },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): Q.Point {
      const y: number = order === 1 ? 2 * t + 0.3 * t * t : order === 2 ? 2 + 0.6 * t : order === 3 ? 0.6 : 0;
      return [3 * (order === 1 ? 1 : 0) + 2 * y, -(order === 1 ? 1 : 0) + 4 * y];
    },
  };
  const before: string = JSON.stringify({ knots, options });
  for (const degree of [3, 4, 5] as const) {
    const fitted: C.IResult = approximate(cubic, { ...options, degree });
    TestValidator.equals("smooth source fully covered", fitted.status, "complete");
    TestValidator.equals("sixteen source pieces become one", fitted.pieces.length, 1);
    for (let i: number = 0; i <= 137; ++i)
      TestValidator.predicate("analytic affine cubic reproduced", Q.distance(C.evaluate(fitted.pieces[0]!, i / 137), cubic.evaluate(i / 137)) < 1e-9);
  }
  const quintic: C.ICurve = {
    domain: [0, 1], knots, breaks: [], closed: false,
    evaluate(t: number): Q.Point { return [t, t ** 5]; },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): Q.Point {
      const coefficients: readonly number[] = [0, 5, 20, 60, 120, 120];
      return [order === 1 ? 1 : 0, coefficients[order]! * t ** (5 - order)];
    },
  };
  const high: C.IResult = approximate(quintic, { ...options, degree: 5 });
  TestValidator.equals("one exact quintic", high.pieces.length, 1);
  TestValidator.equals("quintic complete", high.status, "complete");
  const constrained: C.IResult = approximate(quintic, { ...options, maximumPieces: 1 });
  TestValidator.equals("cubic cannot impersonate quintic at tight tolerance", constrained.status, "refused");
  const selected: C.IResult = approximate(quintic, { ...options, degree: "mixed" });
  TestValidator.equals("mixed uses one qualifying higher-degree piece", selected.pieces.length, 1);
  TestValidator.equals("sampled fit is not a certificate", selected.certified, false);

  const ellipse: C.ICurve = {
    domain: [0, 1], knots, breaks: [], closed: true,
    evaluate(t: number): Q.Point { return t === 1 ? [40, 0] : [40 * Math.cos(2 * Math.PI * t), 20 * Math.sin(2 * Math.PI * t)]; },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): Q.Point {
      const angle: number = 2 * Math.PI * t + order * Math.PI / 2;
      return [40 * (2 * Math.PI) ** order * Math.cos(angle), 20 * (2 * Math.PI) ** order * Math.sin(angle)];
    },
  };
  const oval: C.IResult = approximate(ellipse, { ...options, degree: "mixed" });
  TestValidator.equals("full ellipse complete", oval.status, "complete");
  TestValidator.equals("four exact rational quarters", oval.pieces.length, 4);
  for (const piece of oval.pieces) {
    TestValidator.equals("ellipse uses rational quadratic", piece.kind, "conic");
    for (let i: number = 0; i <= 97; ++i) {
      const p: Q.Point = C.evaluate(piece, i / 97);
      TestValidator.predicate("independent implicit ellipse", nclose((p[0] / 40) ** 2 + (p[1] / 20) ** 2, 1, 1e-10));
    }
  }
  const corner: C.ICurve = {
    domain: [0, 1], knots, breaks: [0.5], closed: false,
    evaluate(t: number): Q.Point { return [t, Math.max(0, t - 0.5)]; },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5, side?: "left" | "right"): Q.Point {
      return order === 1 ? [1, t < 0.5 || (t === 0.5 && side === "left") ? 0 : 1] : [0, 0];
    },
  };
  const angular: C.IResult = approximate(corner, options);
  TestValidator.equals("corner covered", angular.status, "complete");
  TestValidator.equals("two exact linear charts", angular.pieces.length, 2);
  TestValidator.predicate("no piece crosses real corner", angular.pieces.every((piece: C.IPiece): boolean => piece.domain[1] <= 0.5 || piece.domain[0] >= 0.5));

  const exponential: C.ICurve = {
    domain: [0, 1], knots, breaks: [], closed: false,
    evaluate(t: number): Q.Point { return [t, Math.exp(t)]; },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): Q.Point { return [order === 1 ? 1 : 0, Math.exp(t)]; },
  };
  const actual: C.IResult = approximate(exponential, options);
  TestValidator.equals("nonpolynomial fully covered", actual.status, "complete");
  for (const piece of actual.pieces)
    for (let i: number = 0; i <= 137; ++i) {
      const t: number = piece.domain[0] + (piece.domain[1] - piece.domain[0]) * i / 137;
      const p: Q.Point = C.evaluate(piece, i / 137);
      const q: Q.Point = exponential.evaluate(t);

      // Every held-out pair supplies a distance witness in each direction;
      // the true nearest distance cannot exceed this independent witness.
      TestValidator.predicate("independent bidirectional geometric witnesses", Q.distance(p, q) <= options.toleranceMm);
    }
  TestValidator.equals("deterministic output and query accounting", JSON.stringify(approximate(exponential, options)), JSON.stringify(actual));
  TestValidator.equals("inputs unchanged", JSON.stringify({ knots, options }), before);
  TestValidator.equals("nonfinite source refused", approximate({ ...cubic, evaluate(): Q.Point { return [NaN, 0]; } }, options).status, "refused");
  TestValidator.equals("invalid degree budget refused", approximate(cubic, { ...options, maximumPieces: 0 }).status, "refused");
  const limited: C.IResult = approximate(exponential, { ...options, maximumQueries: 1 });
  TestValidator.equals("callback budget explicit", limited.status, "refused");
  TestValidator.predicate("callback limitation diagnosed", limited.diagnostics.some((d: string): boolean => d.includes("query budget")));
}
