import {
  AutoMovieRecoveryConicApproximation as C,
  approximateAutoMovieRecoveryConicsAhn as approximate,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Verify the declared sampled Ahn adaptation against analytic planar curves.
 *
 * Scenarios:
 * 1. Quarter circles and ellipses reproduce their exact conic and analytic locus.
 * 2. A parabola has weight one; a straight source admits a collinear primitive.
 * 3. A cubic inflection splits at its supplied boundary without crossing it.
 * 4. A nonconic cubic meets a separate dense bidirectional distance check.
 * 5. Repeated calls are deterministic; reused source tuples cannot alter saved coefficients.
 * 6. Invalid budgets, throwing/nonfinite callbacks and exhausted subdivision refuse honestly.
 * 7. A translated straight chart and exact one-sided corner jets retain their geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists seven input/behavior scenarios and identifies the approximation's sampled scope.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the pure coefficient producer and evaluates its returned conics against independent circle, ellipse, parabola, line and cubic geometry; asserts coverage, status and budget behavior.
 * @evidence contracts/development/testing.md#independent-expectations Circle weight cos(pi/4), ellipse equation x²/a²+y²/b²=1, parabola y=x² and polynomial closest-point searches provide analytic expectations; held-out 1/97 samples differ from implementation's 1/32 observations.
 * @evidence contracts/development/testing.md#distinguishing-cases Conics and a nonconic distinguish exact reproduction from approximate fitting; inflection, line, malformed options, nonfinite values and an insufficient arc budget distinguish subdivision and explicit refusal.
 * @evidence contracts/development/testing.md#execution-ownership The central test runner discovers this portable CPU-only exported function; its inputs are small analytic callbacks with no files, Human specimen, browser, renderer or subprocess.
 */
export function test_recovery_conics_ahn(): void {
  const options: C.IOptions = { toleranceMm: 1e-5, maximumArcs: 128, maximumDepth: 20 };
  const before: string = JSON.stringify(options);

  /** Independent Bernstein evaluation exercises the saved coefficient format. */
  const point: (arc: C.IArc, u: number) => C.Point = (arc: C.IArc, u: number): C.Point => {
    const weights: readonly [number, number, number] = [(1 - u) ** 2, 2 * arc.weight * u * (1 - u), u * u];
    const denominator: number = weights[0] + weights[1] + weights[2];
    return [
      (weights[0] * arc.controls[0][0] + weights[1] * arc.controls[1][0] + weights[2] * arc.controls[2][0]) / denominator,
      (weights[0] * arc.controls[0][1] + weights[1] * arc.controls[1][1] + weights[2] * arc.controls[2][1]) / denominator,
    ];
  };

  // The geometric oracle follows the analytic ellipse rather than comparing
  // the fitter with samples or coefficients copied from its own output.
  for (const [a, b] of [[1, 1], [12, 3]] as const) {
    const ellipse: C.ICurve = {
      domain: [0, Math.PI / 2], breaks: [], closed: false,
      evaluate: (t: number): C.Point => [a * Math.cos(t), b * Math.sin(t)],
      derivative: (t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => [a * Math.cos(t + order * Math.PI / 2), b * Math.sin(t + order * Math.PI / 2)],
    };
    const result: C.IResult = approximate(ellipse, options);
    TestValidator.equals("ellipse complete", result.status, "complete");
    TestValidator.equals("ellipse single conic", result.arcs.length, 1);
    TestValidator.equals("sample evidence is not a certificate", result.certified, false);
    const arc: C.IArc = result.arcs[0]!;
    TestValidator.predicate("ellipse fullness", nclose(arc.weight, Math.SQRT1_2, 1e-11));
    for (let i: number = 0; i <= 97; ++i) {
      const q: C.Point = point(arc, i / 97);
      TestValidator.predicate("ellipse analytic locus", nclose((q[0] / a) ** 2 + (q[1] / b) ** 2, 1, 1e-11));
    }
  }
  const parabola: C.ICurve = {
    domain: [-1, 1], breaks: [], closed: false,
    evaluate: (t: number): C.Point => [t, t * t],
    derivative: (t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => order === 1 ? [1, 2 * t] : order === 2 ? [0, 2] : [0, 0],
  };
  const parabolic: C.IResult = approximate(parabola, options);
  TestValidator.equals("parabola complete", parabolic.status, "complete");
  TestValidator.equals("parabola single conic", parabolic.arcs.length, 1);
  TestValidator.predicate("parabola weight", nclose(parabolic.arcs[0]!.weight, 1, 1e-12));
  for (let i: number = 0; i <= 97; ++i) {
    const q: C.Point = point(parabolic.arcs[0]!, i / 97);
    TestValidator.predicate("parabola analytic locus", nclose(q[1], q[0] * q[0], 1e-11));
  }
  const line: C.ICurve = {
    domain: [0, 2], breaks: [], closed: false,
    evaluate: (t: number): C.Point => [t, 2 * t + 3],
    derivative: (_t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => order === 1 ? [1, 2] : [0, 0],
  };
  const linear: C.IResult = approximate(line, options);
  TestValidator.equals("line complete", linear.status, "complete");
  TestValidator.equals("line single primitive", linear.arcs.length, 1);
  TestValidator.predicate("line unit weight", nclose(linear.arcs[0]!.weight, 1, 0));
  const scratch: [number, number] = [0, 0];
  const borrowed: C.IResult = approximate({
    domain: [0, 1], breaks: [], closed: false,
    evaluate: (t: number): C.Point => {
      scratch[0] = 2 * t;
      scratch[1] = 3 * t;
      return scratch;
    },
    derivative: (_t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => order === 1 ? [2, 3] : [0, 0],
  }, options);
  scratch[0] = 999;
  scratch[1] = 999;
  TestValidator.equals("scratch tuple line complete", borrowed.status, "complete");
  TestValidator.predicate("returned controls own their coordinates", nclose(borrowed.arcs[0]!.controls[0][0], 0, 0) && nclose(borrowed.arcs[0]!.controls[2][1], 3, 0));
  const translated: C.IResult = approximate({
    ...line,
    domain: [0, 1],
    evaluate: (t: number): C.Point => [1e6 + 2 * t, -1e6 + 3 * t],
    derivative: (_t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => order === 1 ? [2, 3] : [0, 0],
  }, options);
  TestValidator.equals("translated line complete", translated.status, "complete");
  TestValidator.equals("translated line same primitive count", translated.arcs.length, 1);
  TestValidator.predicate("translated line source endpoints", nclose(translated.arcs[0]!.controls[0][0], 1e6, 0) && nclose(translated.arcs[0]!.controls[2][1], -1e6 + 3, 0));
  const leftSecondJets: string[] = [];
  const corner: C.ICurve = {
    domain: [-1, 1], breaks: [0], closed: false,
    evaluate: (t: number): C.Point => t <= 0 ? [t, t * t] : [t, -t],
    derivative: (t: number, order: 1 | 2 | 3 | 4 | 5, side?: "left" | "right"): C.Point => {
      const left: boolean = t < 0 || (t === 0 && side === "left");
      if (t === 0 && order === 2) leftSecondJets.push(side ?? "none");
      return order === 1 ? left ? [1, 2 * t] : [1, -1] : order === 2 && left ? [0, 2] : [0, 0];
    },
  };
  const cornered: C.IResult = approximate(corner, options);
  TestValidator.equals("corner complete", cornered.status, "complete");
  TestValidator.equals("corner exact primitives", cornered.arcs.length, 2);
  TestValidator.predicate("corner left tangent preserved", nclose(cornered.arcs[0]!.controls[1][1], 0, 1e-12));
  TestValidator.predicate("corner right tangent preserved", nclose(cornered.arcs[1]!.controls[1][1], -0.5, 1e-12));
  TestValidator.predicate("corner second-order incident jets", leftSecondJets.includes("left") && leftSecondJets.includes("right"));
  const cubic: C.ICurve = {
    domain: [-1, 1], breaks: [0], closed: false,
    evaluate: (t: number): C.Point => [t, t ** 3],
    derivative: (t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => order === 1 ? [1, 3 * t * t] : order === 2 ? [0, 6 * t] : order === 3 ? [0, 6] : [0, 0],
  };
  const inflected: C.IResult = approximate(cubic, options);
  TestValidator.equals("inflection complete", inflected.status, "complete");
  TestValidator.predicate("inflection separated", inflected.arcs.length >= 2 && inflected.arcs.every((arc: C.IArc): boolean => arc.domain[1] <= 0 || arc.domain[0] >= 0));
  TestValidator.predicate("full inflection coverage", nclose(inflected.arcs[0]!.domain[0], -1, 0) && nclose(inflected.arcs.at(-1)!.domain[1], 1, 0));

  /**
   * Independent geometric oracle: scan the complete parameter interval, then
   * refine its best cell by ternary search. These small analytic arcs have no
   * rapid oscillation, so the 128-cell scan identifies the nearest basin.
   */
  const nearest: (q: C.Point, evaluate: (t: number) => C.Point, a: number, b: number) => number = (
    q: C.Point,
    evaluate: (t: number) => C.Point,
    a: number,
    b: number,
  ): number => {
    const separation: (t: number) => number = (t: number): number => {
      const p: C.Point = evaluate(t);
      return Math.hypot(q[0] - p[0], q[1] - p[1]);
    };
    let index: number = 0;
    let best: number = Infinity;
    for (let i: number = 0; i <= 128; ++i) {
      const value: number = separation(a + (b - a) * i / 128);
      if (value < best) { best = value; index = i; }
    }
    let low: number = a + (b - a) * Math.max(0, index - 1) / 128;
    let high: number = a + (b - a) * Math.min(128, index + 1) / 128;
    for (let i: number = 0; i < 64; ++i) {
      const left: number = (2 * low + high) / 3;
      const right: number = (low + 2 * high) / 3;
      if (separation(left) < separation(right)) high = right;
      else low = left;
    }
    return Math.min(best, separation((low + high) / 2));
  };
  const convex: C.ICurve = {
    domain: [0, 1], breaks: [], closed: false,
    evaluate: (t: number): C.Point => [t, t * t + 0.1 * t ** 3],
    derivative: (t: number, order: 1 | 2 | 3 | 4 | 5): C.Point => order === 1 ? [1, 2 * t + 0.3 * t * t] : order === 2 ? [0, 2 + 0.6 * t] : order === 3 ? [0, 0.6] : [0, 0],
  };
  const fitted: C.IResult = approximate(convex, options);
  TestValidator.equals("nonconic complete", fitted.status, "complete");
  let previous: number = convex.domain[0];
  for (const arc of fitted.arcs) {
    TestValidator.predicate("nonconic no source gap", nclose(arc.domain[0], previous, 0));
    for (let i: number = 0; i <= 97; ++i) {
      const t: number = arc.domain[0] + (arc.domain[1] - arc.domain[0]) * i / 97;
      const source: C.Point = convex.evaluate(t);
      const conic: C.Point = point(arc, i / 97);
      TestValidator.predicate("held-out source to conic", nearest(source, (u: number): C.Point => point(arc, u), 0, 1) <= options.toleranceMm);
      TestValidator.predicate("held-out conic to source", nearest(conic, convex.evaluate, arc.domain[0], arc.domain[1]) <= options.toleranceMm);
    }
    previous = arc.domain[1];
  }
  TestValidator.predicate("nonconic reaches final endpoint", nclose(previous, convex.domain[1], 0));
  const repeated: C.IResult = approximate(convex, options);
  TestValidator.equals("deterministic status", repeated.status, fitted.status);
  TestValidator.equals("deterministic count", repeated.arcs.length, fitted.arcs.length);
  TestValidator.equals("deterministic source queries", repeated.queries, fitted.queries);
  for (const [i, arc] of repeated.arcs.entries())
    TestValidator.predicate("deterministic weights", nclose(arc.weight, fitted.arcs[i]!.weight, 0));
  TestValidator.equals("options not mutated", JSON.stringify(options), before);
  TestValidator.equals("source breaks not mutated", cubic.breaks, [0]);

  // Invalid contracts and inadequate budgets must not return default geometry.
  for (const invalid of [
    { ...options, toleranceMm: NaN },
    { ...options, maximumArcs: 0 },
    { ...options, maximumDepth: 53 },
  ]) {
    const refusal: C.IResult = approximate(convex, invalid);
    TestValidator.equals("invalid admission", refusal.status, "refused");
    TestValidator.equals("admission invokes no callbacks", refusal.queries, 0);
  }
  const nonfinite: C.IResult = approximate({ ...convex, evaluate: (_t: number): C.Point => [NaN, 0] }, options);
  TestValidator.equals("nonfinite source refused", nonfinite.status, "refused");
  TestValidator.equals("nonfinite source no fabricated arcs", nonfinite.arcs.length, 0);
  const nonfiniteJet: C.IResult = approximate({ ...convex, derivative: (_t: number, _order: 1 | 2 | 3 | 4 | 5): C.Point => [Infinity, 0] }, options);
  TestValidator.equals("nonfinite jet refused", nonfiniteJet.status, "refused");
  const throwing: C.IResult = approximate({ ...convex, evaluate: (_t: number): C.Point => { throw new Error("Source acquisition failed"); } }, options);
  TestValidator.equals("throwing source refused", throwing.status, "refused");
  TestValidator.predicate("callback failure explained", throwing.diagnostics.includes("Source acquisition failed"));
  const exhausted: C.IResult = approximate({ ...cubic, breaks: [] }, { ...options, maximumArcs: 1 });
  TestValidator.equals("unsplit inflection refused", exhausted.status, "refused");
  TestValidator.predicate("budget limitation explained", exhausted.diagnostics.some((diagnostic: string): boolean => diagnostic.includes("budget exhausted")));
}
