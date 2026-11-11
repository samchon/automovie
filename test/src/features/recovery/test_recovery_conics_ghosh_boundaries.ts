import {
  AutoMovieRecoveryConicApproximation as C,
  GhoshConicApproximationDisplacement as displacement,
  approximateAutoMovieRecoveryConicsGhosh as approximate,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Preserve complete charts through analytic critical partitions and finite limits.
 *
 * Scenarios:
 * 1. A non-dyadic cubic inflection maps exactly through domain [7,11].
 * 2. The same unpartitioned inflection cannot claim complete strict admission.
 * 3. y=t^3 has a zero-curvature endpoint but emits only finite positive weights.
 * 4. A symmetric noninflected cubic arch splits at its affine-curvature extremum.
 * 5. Rotation, reflection and translation retain partitioned coefficient coverage.
 * 6. A one-arc budget exposes missing coverage rather than bridging it.
 * 7. The infinite-weight triangle limit admits a double root and rejects two distinct roots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven source-partition, boundary-limit, rigid-transform, budget and unique-intersection scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Fits source-only cubic charts, checks complete endpoint coverage and tangent directions, independently minimizes held-out point distances, and exercises the compactified normal intersection directly.
 * @evidence contracts/development/testing.md#independent-expectations Authored Bernstein controls encode x=u,y=(u-1/3)^3, y=u^3 and a symmetric arch. Their inflection and symmetry parameters are analytic; nearest distances use independent ternary minimization of source position rather than fitting normals.
 * @evidence contracts/development/testing.md#distinguishing-cases Non-dyadic critical roots, arbitrary parameter scale, zero endpoint curvature, affine-only criticality, omitted breaks, rigid transforms, exhausted budget and two distinct limit intersections distinguish complete finite construction from hidden gap filling.
 * @evidence contracts/development/testing.md#execution-ownership This synchronous portable unit test uses only small in-memory coefficients and pure recovery calls; the central runner owns execution and actual loft/render verification remains with review.
 */
export function test_recovery_conics_ghosh_boundaries(): void {
  /** Four Bernstein controls represent one exact source polynomial chart. */
  type Controls = readonly [C.Point, C.Point, C.Point, C.Point];
  const options: C.IOptions = {
    toleranceMm: 0.001,
    maximumArcs: 128,
    maximumDepth: 16,
  };

  /** Evaluate the independent Bernstein source by repeated affine interpolation. */
  function value(
    controls: Controls,
    u: number,
    order: 0 | 1 | 2 | 3 | 4 | 5,
  ): C.Point {
    if (order >= 4) return [0, 0];
    let points: C.Point[] = [...controls];
    for (let i: number = 0; i < order; ++i) {
      const degree: number = points.length - 1;
      points = points
        .slice(1)
        .map(
          (p: C.Point, index: number): C.Point => [
            degree * (p[0] - points[index]![0]),
            degree * (p[1] - points[index]![1]),
          ],
        );
    }
    while (points.length > 1)
      points = points
        .slice(1)
        .map(
          (p: C.Point, index: number): C.Point => [
            (1 - u) * points[index]![0] + u * p[0],
            (1 - u) * points[index]![1] + u * p[1],
          ],
        );
    return points[0]!;
  }
  /** Critical parameters change only the chart partition, not points or jets. */
  function chart(controls: Controls, partition: boolean = true): C.ICurve {
    const critical: C.ICubicCriticalParameters =
      C.cubicCriticalParameters(controls);
    return {
      domain: [7, 11],
      closed: false,
      breaks: partition
        ? critical.breaks.map((u: number): number => 7 + 4 * u)
        : [],
      evaluate(t: number): C.Point {
        return value(controls, (t - 7) / 4, 0);
      },
      derivative(t: number, order: 1 | 2 | 3 | 4 | 5): C.Point {
        const p: C.Point = value(controls, (t - 7) / 4, order);
        return [p[0] / 4 ** order, p[1] / 4 ** order];
      },
    };
  }
  /** Coverage and G1 checks use original source jets; no missing interval is skipped. */
  function verify(source: C.ICurve, result: C.IResult): void {
    TestValidator.equals(
      "partitioned source complete",
      result.status,
      "complete",
    );
    let cursor: number = source.domain[0];
    for (const arc of result.arcs) {
      TestValidator.predicate(
        "no omitted parameter interval",
        nclose(arc.domain[0], cursor, 1e-12),
      );
      TestValidator.predicate(
        "only finite positive coefficients",
        Number.isFinite(arc.weight) &&
          arc.weight > 0 &&
          arc.controls.every((p: C.Point): boolean => p.every(Number.isFinite)),
      );
      const start: C.Point = source.evaluate(arc.domain[0]);
      const end: C.Point = source.evaluate(arc.domain[1]);
      TestValidator.predicate(
        "exact source endpoints",
        C.distance(start, arc.controls[0]) < 1e-10 &&
          C.distance(end, arc.controls[2]) < 1e-10,
      );
      for (const endpoint of [0, 1] as const) {
        const tangent: C.Point = source.derivative(
          arc.domain[endpoint],
          1,
          endpoint === 0 ? "right" : "left",
        );
        const conic: C.Point =
          endpoint === 0
            ? [
                arc.controls[1][0] - arc.controls[0][0],
                arc.controls[1][1] - arc.controls[0][1],
              ]
            : [
                arc.controls[2][0] - arc.controls[1][0],
                arc.controls[2][1] - arc.controls[1][1],
              ];
        TestValidator.predicate(
          "source tangent direction preserved",
          Math.abs(C.cross(tangent, conic)) <=
            1e-8 * Math.hypot(...tangent) * Math.hypot(...conic) &&
            tangent[0] * conic[0] + tangent[1] * conic[1] > 0,
        );
      }
      for (let i: number = 1; i < 37; ++i) {
        const p: C.Point = C.evaluate(arc, i / 37);
        let left: number = arc.domain[0];
        let right: number = arc.domain[1];
        for (let iteration: number = 0; iteration < 65; ++iteration) {
          const a: number = (2 * left + right) / 3;
          const b: number = (left + 2 * right) / 3;
          if (
            C.distance(p, source.evaluate(a)) <
            C.distance(p, source.evaluate(b))
          )
            right = b;
          else left = a;
        }
        const discrepancy: number = C.distance(
          p,
          source.evaluate((left + right) / 2),
        );
        TestValidator.predicate(
          "held-out nearest source discrepancy",
          discrepancy <= options.toleranceMm,
        );
        const uncertainty: number =
          128 *
          Number.EPSILON *
          Math.max(
            Math.abs(p[0]),
            Math.abs(p[1]),
            C.distance(arc.controls[0], arc.controls[2]),
          );
        TestValidator.predicate(
          "located extrema cover independent held-out discrepancy",
          discrepancy <= arc.maximumSampleErrorMm + uncertainty,
        );
      }
      cursor = arc.domain[1];
    }
    TestValidator.predicate(
      "complete terminal coverage",
      nclose(cursor, source.domain[1], 1e-12),
    );
    TestValidator.equals(
      "boundary extension is not certified",
      result.certified,
      false,
    );
  }
  const inflection: Controls = [
    [0, -1 / 27],
    [1 / 3, 2 / 27],
    [2 / 3, -4 / 27],
    [1, 8 / 27],
  ];
  const source: C.ICurve = chart(inflection);
  TestValidator.predicate(
    "analytic non-dyadic inflection is registered",
    source.breaks.some((t: number): boolean => nclose(t, 7 + 4 / 3, 1e-10)),
  );
  const fitted: C.IResult = approximate(source, options);
  verify(source, fitted);
  TestValidator.predicate(
    "zero-curvature boundary extension is explicit",
    fitted.diagnostics.some((message: string): boolean =>
      message.includes("boundary extension"),
    ),
  );
  TestValidator.predicate(
    "unpartitioned criticality cannot silently complete",
    approximate(chart(inflection, false), { ...options, maximumDepth: 4 })
      .status !== "complete",
  );

  const cubic: Controls = [
    [0, 0],
    [1 / 3, 0],
    [2 / 3, 0],
    [1, 1],
  ];
  const endpoint: C.ICurve = chart(cubic);
  verify(endpoint, approximate(endpoint, options));
  const arch: Controls = [
    [-2 / 3, 0.5],
    [-2 / 3, -1 / 6],
    [2 / 3, -1 / 6],
    [2 / 3, 0.5],
  ];
  const archSource: C.ICurve = chart(arch);
  TestValidator.predicate(
    "affine-only critical split is registered",
    archSource.breaks.some((t: number): boolean => nclose(t, 9, 1e-10)),
  );
  verify(archSource, approximate(archSource, options));
  for (const reflection of [1, -1]) {
    /** A rigid map changes neither geometric fitting tolerance nor criticality. */
    function transform(p: C.Point): C.Point {
      return [
        1200 + Math.cos(0.73) * p[0] - Math.sin(0.73) * reflection * p[1],
        -800 + Math.sin(0.73) * p[0] + Math.cos(0.73) * reflection * p[1],
      ];
    }
    const moved: Controls = [
      transform(inflection[0]),
      transform(inflection[1]),
      transform(inflection[2]),
      transform(inflection[3]),
    ];
    const movedSource: C.ICurve = chart(moved);
    verify(movedSource, approximate(movedSource, options));
  }
  TestValidator.predicate(
    "finite arc budget preserves missing coverage",
    approximate(source, { ...options, maximumArcs: 1 }).status !== "complete",
  );
  TestValidator.predicate(
    "infinite-weight double root is one geometric intersection",
    nclose(
      displacement({ value: [0.2, 0.6, 0.2], normal: [-1, 2, -1] }, 1)!,
      0.2,
      1e-12,
    ),
  );
  TestValidator.equals(
    "distinct valid normal intersections remain unsupported",
    displacement({ value: [0.2, 0.6, 0.2], normal: [1, 0, -1] }, 1),
    undefined,
  );
}
