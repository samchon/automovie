import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
  IAutoMovieRegisteredConicArc,
} from "@automovie/interface";
import { approximateAutoMovieRecoveryConicsAhn as approximate } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Verify the declared sampled Ahn adaptation against analytic planar curves.
 *
 * Scenarios:
 *
 * 1. Quarter circles and ellipses reproduce their exact conic and analytic locus.
 * 2. A parabola has weight one; a straight source admits a collinear primitive.
 * 3. A cubic inflection splits at its supplied boundary without crossing it.
 * 4. A nonconic cubic meets a separate dense bidirectional distance check.
 * 5. Repeated calls are deterministic; reused source tuples cannot alter saved
 *    coefficients.
 * 6. Invalid budgets, throwing/nonfinite callbacks and exhausted subdivision
 *    refuse honestly.
 * 7. A translated straight chart and exact one-sided corner jets retain their
 *    geometry.
 * 8. A near-flat stretch between two close inflections far from the origin, which
 *    bends by less than its coordinates' roundoff, is covered as the collinear
 *    primitive within the tolerance, and a stretch beyond the tolerance of its
 *    chord is not drawn straight.
 */
export function test_unit_recovery_curves_approximate_conics_ahn(): void {
  const options: IAutoMovieConicApproximation.IOptions = {
    toleranceMm: 1e-5,
    maximumArcs: 128,
    maximumDepth: 20,
  };
  const before: string = JSON.stringify(options);

  /** Independent Bernstein evaluation exercises the saved coefficient format. */
  const point: (
    arc: IAutoMovieRegisteredConicArc,
    u: number,
  ) => Readonly<AutoMovieVector2Tuple> = (
    arc: IAutoMovieRegisteredConicArc,
    u: number,
  ): Readonly<AutoMovieVector2Tuple> => {
    const weights: readonly [number, number, number] = [
      (1 - u) ** 2,
      2 * arc.weight * u * (1 - u),
      u * u,
    ];
    const denominator: number = weights[0] + weights[1] + weights[2];
    return [
      (weights[0] * arc.controls[0][0] +
        weights[1] * arc.controls[1][0] +
        weights[2] * arc.controls[2][0]) /
        denominator,
      (weights[0] * arc.controls[0][1] +
        weights[1] * arc.controls[1][1] +
        weights[2] * arc.controls[2][1]) /
        denominator,
    ];
  };

  // The geometric oracle follows the analytic ellipse rather than comparing
  // the fitter with samples or coefficients copied from its own output.
  for (const [a, b] of [
    [1, 1],
    [12, 3],
  ] as const) {
    const ellipse: IAutoMoviePlanarCurveSource = {
      domain: [0, Math.PI / 2],
      breaks: [],
      closed: false,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        a * Math.cos(t),
        b * Math.sin(t),
      ],
      derivative: (
        t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => [
        a * Math.cos(t + (order * Math.PI) / 2),
        b * Math.sin(t + (order * Math.PI) / 2),
      ],
    };
    const result: IAutoMovieConicApproximation.IResult = approximate(
      ellipse,
      options,
    );
    TestValidator.equals("ellipse complete", result.status, "complete");
    TestValidator.equals("ellipse single conic", result.arcs.length, 1);
    TestValidator.equals(
      "sample evidence is not a certificate",
      result.certified,
      false,
    );
    const arc: IAutoMovieRegisteredConicArc = result.arcs[0]!;
    TestValidator.predicate(
      "ellipse fullness",
      nclose(arc.weight, Math.SQRT1_2, 1e-11),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const q: Readonly<AutoMovieVector2Tuple> = point(arc, i / 97);
      TestValidator.predicate(
        "ellipse analytic locus",
        nclose((q[0] / a) ** 2 + (q[1] / b) ** 2, 1, 1e-11),
      );
    }
  }
  const parabola: IAutoMoviePlanarCurveSource = {
    domain: [-1, 1],
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, t * t],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1 ? [1, 2 * t] : order === 2 ? [0, 2] : [0, 0],
  };
  const parabolic: IAutoMovieConicApproximation.IResult = approximate(
    parabola,
    options,
  );
  TestValidator.equals("parabola complete", parabolic.status, "complete");
  TestValidator.equals("parabola single conic", parabolic.arcs.length, 1);
  TestValidator.predicate(
    "parabola weight",
    nclose(parabolic.arcs[0]!.weight, 1, 1e-12),
  );
  for (let i: number = 0; i <= 97; ++i) {
    const q: Readonly<AutoMovieVector2Tuple> = point(
      parabolic.arcs[0]!,
      i / 97,
    );
    TestValidator.predicate(
      "parabola analytic locus",
      nclose(q[1], q[0] * q[0], 1e-11),
    );
  }
  const line: IAutoMoviePlanarCurveSource = {
    domain: [0, 2],
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, 2 * t + 3],
    derivative: (
      _t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> => (order === 1 ? [1, 2] : [0, 0]),
  };
  const linear: IAutoMovieConicApproximation.IResult = approximate(
    line,
    options,
  );
  TestValidator.equals("line complete", linear.status, "complete");
  TestValidator.equals("line single primitive", linear.arcs.length, 1);
  TestValidator.predicate(
    "line unit weight",
    nclose(linear.arcs[0]!.weight, 1, 0),
  );
  const scratch: [number, number] = [0, 0];
  const borrowed: IAutoMovieConicApproximation.IResult = approximate(
    {
      domain: [0, 1],
      breaks: [],
      closed: false,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => {
        scratch[0] = 2 * t;
        scratch[1] = 3 * t;
        return scratch;
      },
      derivative: (
        _t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => (order === 1 ? [2, 3] : [0, 0]),
    },
    options,
  );
  scratch[0] = 999;
  scratch[1] = 999;
  TestValidator.equals(
    "scratch tuple line complete",
    borrowed.status,
    "complete",
  );
  TestValidator.predicate(
    "returned controls own their coordinates",
    nclose(borrowed.arcs[0]!.controls[0][0], 0, 0) &&
      nclose(borrowed.arcs[0]!.controls[2][1], 3, 0),
  );
  const translated: IAutoMovieConicApproximation.IResult = approximate(
    {
      ...line,
      domain: [0, 1],
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        1e6 + 2 * t,
        -1e6 + 3 * t,
      ],
      derivative: (
        _t: number,
        order: 1 | 2 | 3 | 4 | 5,
      ): Readonly<AutoMovieVector2Tuple> => (order === 1 ? [2, 3] : [0, 0]),
    },
    options,
  );
  TestValidator.equals(
    "translated line complete",
    translated.status,
    "complete",
  );
  TestValidator.equals(
    "translated line same primitive count",
    translated.arcs.length,
    1,
  );
  TestValidator.predicate(
    "translated line source endpoints",
    nclose(translated.arcs[0]!.controls[0][0], 1e6, 0) &&
      nclose(translated.arcs[0]!.controls[2][1], -1e6 + 3, 0),
  );
  const leftSecondJets: string[] = [];
  const corner: IAutoMoviePlanarCurveSource = {
    domain: [-1, 1],
    breaks: [0],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> =>
      t <= 0 ? [t, t * t] : [t, -t],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
      side?: "left" | "right",
    ): Readonly<AutoMovieVector2Tuple> => {
      const left: boolean = t < 0 || (t === 0 && side === "left");
      if (t === 0 && order === 2) leftSecondJets.push(side ?? "none");
      return order === 1
        ? left
          ? [1, 2 * t]
          : [1, -1]
        : order === 2 && left
          ? [0, 2]
          : [0, 0];
    },
  };
  const cornered: IAutoMovieConicApproximation.IResult = approximate(
    corner,
    options,
  );
  TestValidator.equals("corner complete", cornered.status, "complete");
  TestValidator.equals("corner exact primitives", cornered.arcs.length, 2);
  TestValidator.predicate(
    "corner left tangent preserved",
    nclose(cornered.arcs[0]!.controls[1][1], 0, 1e-12),
  );
  TestValidator.predicate(
    "corner right tangent preserved",
    nclose(cornered.arcs[1]!.controls[1][1], -0.5, 1e-12),
  );
  TestValidator.predicate(
    "corner second-order incident jets",
    leftSecondJets.includes("left") && leftSecondJets.includes("right"),
  );
  const cubic: IAutoMoviePlanarCurveSource = {
    domain: [-1, 1],
    breaks: [0],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, t ** 3],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1
        ? [1, 3 * t * t]
        : order === 2
          ? [0, 6 * t]
          : order === 3
            ? [0, 6]
            : [0, 0],
  };
  const inflected: IAutoMovieConicApproximation.IResult = approximate(
    cubic,
    options,
  );
  TestValidator.equals("inflection complete", inflected.status, "complete");
  TestValidator.predicate(
    "inflection separated",
    inflected.arcs.length >= 2 &&
      inflected.arcs.every(
        (arc: IAutoMovieRegisteredConicArc): boolean =>
          arc.domain[1] <= 0 || arc.domain[0] >= 0,
      ),
  );
  TestValidator.predicate(
    "full inflection coverage",
    nclose(inflected.arcs[0]!.domain[0], -1, 0) &&
      nclose(inflected.arcs.at(-1)!.domain[1], 1, 0),
  );

  /**
   * Independent geometric oracle: scan the complete parameter interval, then
   * refine its best cell by ternary search. These small analytic arcs have no
   * rapid oscillation, so the 128-cell scan identifies the nearest basin.
   */
  const nearest: (
    q: Readonly<AutoMovieVector2Tuple>,
    evaluate: (t: number) => Readonly<AutoMovieVector2Tuple>,
    a: number,
    b: number,
  ) => number = (
    q: Readonly<AutoMovieVector2Tuple>,
    evaluate: (t: number) => Readonly<AutoMovieVector2Tuple>,
    a: number,
    b: number,
  ): number => {
    const separation: (t: number) => number = (t: number): number => {
      const p: Readonly<AutoMovieVector2Tuple> = evaluate(t);
      return Math.hypot(q[0] - p[0], q[1] - p[1]);
    };
    let index: number = 0;
    let best: number = Infinity;
    for (let i: number = 0; i <= 128; ++i) {
      const value: number = separation(a + ((b - a) * i) / 128);
      if (value < best) {
        best = value;
        index = i;
      }
    }
    let low: number = a + ((b - a) * Math.max(0, index - 1)) / 128;
    let high: number = a + ((b - a) * Math.min(128, index + 1)) / 128;
    for (let i: number = 0; i < 64; ++i) {
      const left: number = (2 * low + high) / 3;
      const right: number = (low + 2 * high) / 3;
      if (separation(left) < separation(right)) high = right;
      else low = left;
    }
    return Math.min(best, separation((low + high) / 2));
  };
  const convex: IAutoMoviePlanarCurveSource = {
    domain: [0, 1],
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
      t,
      t * t + 0.1 * t ** 3,
    ],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1
        ? [1, 2 * t + 0.3 * t * t]
        : order === 2
          ? [0, 2 + 0.6 * t]
          : order === 3
            ? [0, 0.6]
            : [0, 0],
  };
  const fitted: IAutoMovieConicApproximation.IResult = approximate(
    convex,
    options,
  );
  TestValidator.equals("nonconic complete", fitted.status, "complete");
  let previous: number = convex.domain[0];
  for (const arc of fitted.arcs) {
    TestValidator.predicate(
      "nonconic no source gap",
      nclose(arc.domain[0], previous, 0),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const t: number =
        arc.domain[0] + ((arc.domain[1] - arc.domain[0]) * i) / 97;
      const source: Readonly<AutoMovieVector2Tuple> = convex.evaluate(t);
      const conic: Readonly<AutoMovieVector2Tuple> = point(arc, i / 97);
      TestValidator.predicate(
        "held-out source to conic",
        nearest(
          source,
          (u: number): Readonly<AutoMovieVector2Tuple> => point(arc, u),
          0,
          1,
        ) <= options.toleranceMm,
      );
      TestValidator.predicate(
        "held-out conic to source",
        nearest(conic, convex.evaluate, arc.domain[0], arc.domain[1]) <=
          options.toleranceMm,
      );
    }
    previous = arc.domain[1];
  }
  TestValidator.predicate(
    "nonconic reaches final endpoint",
    nclose(previous, convex.domain[1], 0),
  );

  // A near-flat stretch between two close inflections, far from the origin. y = c (t^4 / 12 - d^2 t^2 / 2) has y'' = c (t^2 - d^2):
  // inflections at -d and d, supplied as breaks, and between them a bend whose sagitta, about 5 c d^4 / 24 = 2e-13, lies under the
  // roundoff of coordinates near 1e6 (an ulp of 1.2e-10), while its end tangents differ by 4 c d^3 / 3 = 1.3e-9 rad, far above roundoff.
  // Its samples then fall either side of its chord by roundoff and no control triangle holds them at any depth. It lies within the
  // tolerance of its chord, so it is converted, as the contract's collinear primitive, and the whole chart is covered.
  const c: number = 1,
    d: number = 1e-3;
  const shallow: IAutoMoviePlanarCurveSource = {
    domain: [-0.5, 0.5],
    breaks: [-d, d],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
      1e6 + t,
      -1e6 + c * (t ** 4 / 12 - (d * d * t * t) / 2),
    ],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1
        ? [1, c * (t ** 3 / 3 - d * d * t)]
        : order === 2
          ? [0, c * (t * t - d * d)]
          : order === 3
            ? [0, 2 * c * t]
            : order === 4
              ? [0, 2 * c]
              : [0, 0],
  };
  const flat: IAutoMovieConicApproximation.IResult = approximate(
    shallow,
    options,
  );
  TestValidator.equals("near-flat stretch complete", flat.status, "complete");
  let reached: number = shallow.domain[0];
  for (const arc of flat.arcs) {
    TestValidator.predicate(
      "near-flat no source gap",
      nclose(arc.domain[0], reached, 0),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const t: number =
        arc.domain[0] + ((arc.domain[1] - arc.domain[0]) * i) / 97;
      TestValidator.predicate(
        "near-flat held-out source to primitive",
        nearest(
          shallow.evaluate(t),
          (u: number): Readonly<AutoMovieVector2Tuple> => point(arc, u),
          0,
          1,
        ) <= options.toleranceMm,
      );
    }
    reached = arc.domain[1];
  }
  TestValidator.predicate(
    "near-flat reaches final endpoint",
    nclose(reached, shallow.domain[1], 0),
  );
  const middle: IAutoMovieRegisteredConicArc | undefined = flat.arcs.find(
    (arc: IAutoMovieRegisteredConicArc): boolean => arc.domain[0] === -d,
  );
  TestValidator.predicate(
    "near-flat middle is the collinear primitive",
    middle !== undefined && middle.domain[1] === d && middle.weight === 1,
  );
  // A curved stretch whose chord leaves its samples farther than the tolerance is still subdivided, not drawn straight: the same chart
  // at a tolerance under its middle's sagitta measured at unit scale.
  const unshifted: IAutoMovieConicApproximation.IResult = approximate(
    {
      ...shallow,
      evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
        t,
        c * (t ** 4 / 12 - (d * d * t * t) / 2),
      ],
    },
    { ...options, toleranceMm: 1e-14 },
  );
  TestValidator.predicate(
    "curved stretch under a tighter tolerance is not a line",
    unshifted.arcs
      .filter(
        (arc: IAutoMovieRegisteredConicArc): boolean =>
          arc.domain[0] >= -d && arc.domain[1] <= d,
      )
      .every(
        (arc: IAutoMovieRegisteredConicArc): boolean =>
          arc.maximumSampleErrorMm <= 1e-14,
      ),
  );
  const repeated: IAutoMovieConicApproximation.IResult = approximate(
    convex,
    options,
  );
  TestValidator.equals("deterministic status", repeated.status, fitted.status);
  TestValidator.equals(
    "deterministic count",
    repeated.arcs.length,
    fitted.arcs.length,
  );
  TestValidator.equals(
    "deterministic source queries",
    repeated.queries,
    fitted.queries,
  );
  for (const [i, arc] of repeated.arcs.entries())
    TestValidator.predicate(
      "deterministic weights",
      nclose(arc.weight, fitted.arcs[i]!.weight, 0),
    );
  TestValidator.equals("options not mutated", JSON.stringify(options), before);
  TestValidator.equals("source breaks not mutated", cubic.breaks, [0]);

  // Invalid contracts and inadequate budgets must not return default geometry.
  for (const invalid of [
    { ...options, maximumArcs: 0 },
    { ...options, maximumDepth: 53 },
  ]) {
    const refusal: IAutoMovieConicApproximation.IResult = approximate(
      convex,
      invalid,
    );
    TestValidator.equals("invalid admission", refusal.status, "refused");
    TestValidator.equals("admission invokes no callbacks", refusal.queries, 0);
  }
  const throwing: IAutoMovieConicApproximation.IResult = approximate(
    {
      ...convex,
      evaluate: (_t: number): Readonly<AutoMovieVector2Tuple> => {
        throw new Error("Source acquisition failed");
      },
    },
    options,
  );
  TestValidator.equals("throwing source refused", throwing.status, "refused");
  TestValidator.predicate(
    "callback failure explained",
    throwing.diagnostics.includes("Source acquisition failed"),
  );
  const exhausted: IAutoMovieConicApproximation.IResult = approximate(
    { ...cubic, breaks: [] },
    { ...options, maximumArcs: 1 },
  );
  TestValidator.equals(
    "unsplit inflection refused",
    exhausted.status,
    "refused",
  );
  TestValidator.predicate(
    "budget limitation explained",
    exhausted.diagnostics.some((diagnostic: string): boolean =>
      diagnostic.includes("budget exhausted"),
    ),
  );
}
