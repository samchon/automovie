import {
  AutoMovieRecoveryConicApproximation as C,
  approximateAutoMovieRecoveryConicsGhosh as approximate,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Exercise the paper's conic reproduction, equioscillation and admission seams.
 *
 * Scenarios:
 * 1. A quarter ellipse and reversed circle retain their analytic implicit form.
 * 2. An exponential graph with monotone affine curvature meets held-out error.
 * 3. Source breaks survive, output is deterministic, and input arrays are unchanged.
 * 4. An inflection, a stationary point and invalid budgets cannot claim complete admission.
 * 5. Exactly straight input is translation/scale invariant within roundoff.
 * 6. Exact incident endpoint jets preserve two parabolas' shared corner.
 * 7. Throwing/nonfinite callbacks refuse and reused scratch tuples are copied.
 * 8. A strongly reparameterized parabola retains its exact endpoint limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eight numerical construction and admission scenarios, their analytic oracles and the absence of certification.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public fitter and evaluates its returned rational coefficients at independent nodes, checking statuses, source breaks and refusal diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations Ellipse and circle implicit equations, endpoint tangent intersections and cosine half-angle weights are analytic; the exponential oracle uses nearest-point minimization against exp(x), independent of the fit's source-normal samples.
 * @evidence contracts/development/testing.md#distinguishing-cases Reversed orientation, a nonconic monotone-affine graph, hard breaks, singular and inflected jets, zero arc budget and the exact line extension distinguish reproduction, approximation and admission failures.
 * @evidence contracts/development/testing.md#execution-ownership The central runner discovers this synchronous portable unit test; no private F1 data, host, process, filesystem or rendering is involved.
 */
export function test_recovery_conics_ghosh(): void {
  const options: C.IOptions = {
    toleranceMm: 0.0001,
    maximumArcs: 128,
    maximumDepth: 14,
  };

  // Trigonometric derivatives provide an independent smooth ellipse source.
  for (const direction of [1, -1]) {
    const rx: number = direction === 1 ? 40 : 25;
    const ry: number = direction === 1 ? 20 : 25;
    const ellipse: C.ICurve = {
      domain: [0, Math.PI / 2],
      breaks: [],
      closed: false,
      evaluate(t: number): C.Point {
        return [rx * Math.cos(t), direction * ry * Math.sin(t)];
      },
      derivative(t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
        return [
          rx * Math.cos(t + (order * Math.PI) / 2),
          direction * ry * Math.sin(t + (order * Math.PI) / 2),
        ];
      },
    };
    const result: C.IResult = approximate(ellipse, options);
    TestValidator.equals("ellipse admitted", result.status, "complete");
    TestValidator.equals("ellipse one bitangent conic", result.arcs.length, 1);
    const arc: C.IArc = result.arcs[0]!;
    TestValidator.predicate(
      "analytic quarter-conic weight",
      nclose(arc.weight, Math.SQRT1_2, 1e-6),
    );
    for (let i: number = 0; i <= 97; ++i) {
      const p: C.Point = C.evaluate(arc, i / 97);
      TestValidator.predicate(
        "analytic implicit conic",
        nclose((p[0] / rx) ** 2 + (p[1] / ry) ** 2, 1, 1e-6),
      );
    }
    TestValidator.equals(
      "numerical evidence is not certification",
      result.certified,
      false,
    );
  }

  // k_affine(t)=-2*exp(-2t/3)/9 is strictly increasing on this graph.
  const exponential: C.ICurve = {
    domain: [0, 0.8],
    breaks: [0.3],
    closed: false,
    evaluate(t: number): C.Point {
      return [t, Math.exp(t)];
    },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
      return [order === 1 ? 1 : 0, Math.exp(t)];
    },
  };
  const before: string = JSON.stringify(exponential.breaks);
  const fit: C.IResult = approximate(exponential, options);
  TestValidator.equals("affine spiral admitted", fit.status, "complete");
  TestValidator.equals(
    "deterministic coefficients",
    JSON.stringify(approximate(exponential, options)),
    JSON.stringify(fit),
  );
  TestValidator.equals(
    "source breaks unchanged",
    JSON.stringify(exponential.breaks),
    before,
  );
  TestValidator.predicate(
    "preserved hard source break",
    fit.arcs.every(
      (arc: C.IArc): boolean => !(arc.domain[0] < 0.3 && arc.domain[1] > 0.3),
    ),
  );
  for (const arc of fit.arcs) {
    for (let i: number = 1; i < 73; ++i) {
      const p: C.Point = C.evaluate(arc, i / 73);
      let left: number = arc.domain[0];
      let right: number = arc.domain[1];

      // The squared distance to exp(x) is unimodal in this short convex chart.
      // Ternary minimization does not reuse fitting nodes or normal crossings.
      for (let iteration: number = 0; iteration < 70; ++iteration) {
        const u: number = (2 * left + right) / 3;
        const v: number = (left + 2 * right) / 3;
        const du: number = (u - p[0]) ** 2 + (Math.exp(u) - p[1]) ** 2;
        const dv: number = (v - p[0]) ** 2 + (Math.exp(v) - p[1]) ** 2;
        if (du < dv) right = v;
        else left = u;
      }
      const t: number = (left + right) / 2;
      TestValidator.predicate(
        "independent held-out source distance",
        Math.hypot(t - p[0], Math.exp(t) - p[1]) <= options.toleranceMm,
      );
    }
  }
  const inflected: C.ICurve = {
    domain: [-1, 1],
    breaks: [],
    closed: false,
    evaluate(t: number): C.Point {
      return [t, t ** 3];
    },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
      return order === 1
        ? [1, 3 * t * t]
        : order === 2
          ? [0, 6 * t]
          : order === 3
            ? [0, 6]
            : [0, 0];
    },
  };
  const limited: C.IResult = approximate(inflected, {
    ...options,
    maximumArcs: 8,
    maximumDepth: 3,
  });
  TestValidator.predicate(
    "inflection cannot claim complete admission",
    limited.status !== "complete",
  );
  const stationary: C.ICurve = {
    ...inflected,
    derivative(): C.Point {
      return [0, 0];
    },
  };
  TestValidator.equals(
    "stationary source refused",
    approximate(stationary, { ...options, maximumDepth: 2 }).status,
    "refused",
  );
  TestValidator.equals(
    "invalid budget refused",
    approximate(exponential, { ...options, maximumArcs: 0 }).status,
    "refused",
  );
  const straight: C.ICurve = {
    domain: [0, 2],
    breaks: [],
    closed: false,
    evaluate(t: number): C.Point {
      return [3 * t, 4 * t];
    },
    derivative(_t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
      return order === 1 ? [3, 4] : [0, 0];
    },
  };
  const line: C.IResult = approximate(straight, options);
  TestValidator.equals("line extension admitted", line.status, "complete");
  TestValidator.predicate(
    "line extension is explicit",
    line.diagnostics.some((diagnostic: string): boolean =>
      diagnostic.includes("line extension"),
    ),
  );
  for (const scale of [1e-6, 1e6]) {
    const transformed: C.ICurve = {
      ...straight,
      evaluate(t: number): C.Point {
        return [scale * (30 + 3 * t), scale * (-40 + 4 * t)];
      },
      derivative(_t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
        return order === 1 ? [3 * scale, 4 * scale] : [0, 0];
      },
    };
    const transformedResult: C.IResult = approximate(transformed, options);
    TestValidator.equals(
      "scaled and translated line admitted",
      transformedResult.status,
      "complete",
    );
    TestValidator.equals(
      "scaled line remains one primitive",
      transformedResult.arcs.length,
      1,
    );
  }

  // The callback's ordinary value at t=1 deliberately selects the right chart.
  const corner: C.ICurve = {
    domain: [0, 2],
    breaks: [1],
    closed: false,
    evaluate(t: number): C.Point {
      return [t, t <= 1 ? t * t : 1 + 3 * (t - 1) + (t - 1) ** 2];
    },
    derivative(
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
      side?: "left" | "right",
    ): C.Point {
      const left: boolean = t < 1 || (t === 1 && side === "left");
      return order === 1
        ? [1, left ? 2 * t : 3 + 2 * (t - 1)]
        : order === 2
          ? [0, 2]
          : [0, 0];
    },
  };
  const cornerResult: C.IResult = approximate(corner, options);
  TestValidator.equals(
    "both incident parabola charts admitted",
    cornerResult.status,
    "complete",
  );
  TestValidator.equals(
    "a corner does not cause needless subdivision",
    cornerResult.arcs.length,
    2,
  );
  for (const arc of cornerResult.arcs)
    for (let i: number = 0; i <= 41; ++i) {
      const p: C.Point = C.evaluate(arc, i / 41);
      const expected: number =
        arc.domain[0] === 0 ? p[0] ** 2 : 1 + 3 * (p[0] - 1) + (p[0] - 1) ** 2;
      TestValidator.predicate(
        "incident jet preserves the exact parabola",
        nclose(p[1], expected, 1e-9),
      );
    }
  for (const corrupt of [
    {
      ...exponential,
      evaluate(): C.Point {
        throw new Error("source unavailable");
      },
    },
    {
      ...exponential,
      evaluate(): C.Point {
        return [NaN, 0];
      },
    },
  ]) {
    const failure: C.IResult = approximate(corrupt, options);
    TestValidator.equals("corrupt callback refused", failure.status, "refused");
    TestValidator.equals(
      "corrupt callback leaves no coefficients",
      failure.arcs.length,
      0,
    );
    TestValidator.predicate(
      "callback failure is diagnosed",
      failure.diagnostics.some((message: string): boolean =>
        message.includes("Source callback failure"),
      ),
    );
  }
  const scratch: [number, number] = [0, 0];
  const reusable: C.ICurve = {
    ...exponential,
    evaluate(t: number): C.Point {
      scratch[0] = t;
      scratch[1] = Math.exp(t);
      return scratch;
    },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
      scratch[0] = order === 1 ? 1 : 0;
      scratch[1] = Math.exp(t);
      return scratch;
    },
  };
  const copied: C.IResult = approximate(reusable, options);
  TestValidator.equals(
    "scratch source matches ordinary source",
    JSON.stringify(copied.arcs),
    JSON.stringify(fit.arcs),
  );
  const snapshot: string = JSON.stringify(copied.arcs);
  scratch[0] = 1e9;
  scratch[1] = -1e9;
  TestValidator.equals(
    "output does not retain source scratch storage",
    JSON.stringify(copied.arcs),
    snapshot,
  );

  // x=t/(e+(1-e)t) clusters ordinary interior source points near t=0.
  // Its exact geometric parabola must not depend on an interior-contact inset.
  const clustered: C.ICurve = {
    domain: [0, 1],
    breaks: [],
    closed: false,
    evaluate(t: number): C.Point {
      const x: number = t / (0.01 + 0.99 * t);
      return [x, x * x];
    },
    derivative(t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
      const d: number = 0.01 + 0.99 * t;
      const x: number = t / d;
      const factorial: readonly number[] = [1, 1, 2, 6, 24, 120];
      const v: number[] = [x];
      for (let i: number = 1; i <= 5; ++i)
        v.push(
          ((i % 2 === 1 ? 1 : -1) * factorial[i]! * 0.01 * 0.99 ** (i - 1)) /
            d ** (i + 1),
        );
      const binomial: readonly (readonly number[])[] = [
        [1],
        [1, 1],
        [1, 2, 1],
        [1, 3, 3, 1],
        [1, 4, 6, 4, 1],
        [1, 5, 10, 10, 5, 1],
      ];
      let y: number = 0;
      for (let i: number = 0; i <= order; ++i)
        y += binomial[order]![i]! * v[i]! * v[order - i]!;
      return [v[order]!, y];
    },
  };
  const clusteredResult: C.IResult = approximate(clustered, {
    ...options,
    maximumArcs: 8,
  });
  TestValidator.equals(
    "clustered exact conic admitted",
    clusteredResult.status,
    "complete",
  );
  TestValidator.equals(
    "contact parameter does not split an exact parabola",
    clusteredResult.arcs.length,
    1,
  );
  TestValidator.predicate(
    "endpoint triple contact preserves parabola weight",
    nclose(clusteredResult.arcs[0]!.weight, 1, 1e-6),
  );
}
