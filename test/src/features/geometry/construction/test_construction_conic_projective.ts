import type { AutoMoviePolarSector } from "@automovie/engine";

import { AutoMovieConicHermite } from "../../../../../packages/engine/src/geometry/construction/AutoMovieConicHermite";
import { ConstructionConicOracle } from "../../internal/construction/ConstructionConicOracle";

/**
 * A positive rational clock cannot change the geometric curve or its polar jet.
 *
 * Scenarios:
 * 1. Degree-elevated exact ellipse quarters cover seven aspects, reciprocal
 *    orientations and three scales. Multiplying weight i by k^i is precisely
 *    t=k*v/(1-v+k*v), so k from1e-100 to1e100 preserves every ellipse point.
 *    Radius and two angular derivatives have independent implicit expectations.
 * 2. Endpoints, near-end rays and interior rays retain the same expectations;
 *    the native clock can be closer to one than binary64 can represent.
 * 3. Actual G2 preparations with curvature ratios down to1e-240 retain their
 *    original conic point-error envelope and finite convex polar jets. This is
 *    an arithmetic observation, not an interval certificate for every input.
 * 4. Outside/nonfinite angles remain nonfinite. The independent reader rejects
 *    a made0.01-scale slope error with its unchanged2e-9 comparison limit.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production Hermite.radius on exact conics with projectively changed clocks and on actual admitted G2 ends; reads all three polar components, support endpoints, finite/count failures and convexity.
 * @evidence contracts/testing.md#independent-expectations The fixed ellipse controls are homogeneous degree elevation of [(a,0),(a,b),(0,b)] with weight1/sqrt(2). The identity weight_i*k^i follows by direct substitution of t=k*v/(1-v+k*v). Closed-form ellipse jets come from the implicit ellipse oracle; no production inverse, tangent or homogeneous determinant supplies those answers.
 * @evidence contracts/testing.md#distinguishing-cases Includes42 ellipse boxes, reciprocal/scaled shapes, seven clocks including both extreme directions, exact and near endpoints, actual tiny-curvature-ratio ends, invalid queries and a made slope error. Native t bisection loses these projective cases despite unchanged geometry.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU question through --include construction_conic_projective; creates no person, browser, host, fixture or GPU work and joins the shared construction round.
 */
export function test_construction_conic_projective(): void {
  const failures: string[] = [];
  const w: number = Math.SQRT1_2;
  const u: number = (1 + 2 * w) / 3;
  const q: number = (2 * w) / (1 + 2 * w);
  const angles: number[] = [
    0,
    1e-12,
    1 - 1e-12,
    1,
    ...Array.from(
      { length: 33 },
      (_: unknown, i: number): number => (i + 0.3) / 34,
    ),
  ];
  for (const aspect of [1, 2, 4, 8, 16, 32, 64])
    for (const reverse of [false, true])
      for (const scale of [0.001, 1, 1000]) {
        const a: number = scale * (reverse ? aspect : 1);
        const b: number = scale * (reverse ? 1 : aspect);
        for (const k of [1e-100, 1e-30, 1e-10, 1, 1e10, 1e30, 1e100]) {
          const patch: AutoMovieConicHermite.IPatch = {
            extent: a,
            deficit: a,
            height: b,
            native: 1,
            angle: Math.PI / 2,
            curvature: a / (b * b),
            points: [
              [0, 0],
              [0, q],
              [1 - q, 1],
              [1, 1],
            ],
            weights: [1, u * k, u * k * k, k ** 3],
          };
          for (const share of angles) {
            const angle: number = share * patch.angle;
            ConstructionConicOracle.compare(
              failures,
              `projective ellipse ${aspect}/${reverse}/${scale}/${k}/${share}`,
              AutoMovieConicHermite.radius(patch, angle),
              ConstructionConicOracle.ellipse(a, b, angle),
              scale,
              2e-9,
            );
          }
        }
      }

  const E: number = Math.SQRT2 - 1;
  for (const tau of [1e-12, 1e-30, 1e-60, 1e-120, 1e-240]) {
    const prepared: AutoMovieConicHermite.IPatch | string | null =
      AutoMovieConicHermite.create(1, 1, E, tau);
    if (prepared === null || typeof prepared === "string") {
      failures.push(`positive-weight G2 fixture ${tau}: ${prepared}`);
      continue;
    }
    for (const share of [0, 0.01, 0.1, 0.5, 0.9, 0.99, 1]) {
      const jet: AutoMoviePolarSector.Jet = AutoMovieConicHermite.radius(
        prepared,
        share * prepared.angle,
      );
      const turn: number = jet[0] ** 2 + 2 * jet[1] ** 2 - jet[0] * jet[2];
      const floor: number =
        256 *
        Number.EPSILON *
        (jet[0] ** 2 + 2 * jet[1] ** 2 + Math.abs(jet[0] * jet[2]));
      if (
        !(
          jet.every(Number.isFinite) &&
          Math.abs(jet[0] - 1) <= 1e-7 &&
          turn >= -floor
        )
      )
        failures.push(
          `positive-weight G2 ${tau}/${share}: ${jet}, numerator ${turn}`,
        );
    }
    for (const angle of [-prepared.angle, 2 * prepared.angle, NaN])
      if (AutoMovieConicHermite.radius(prepared, angle).some(Number.isFinite))
        failures.push(`outside projective query ${angle} became finite`);
  }

  const red: string[] = [];
  const expected: AutoMoviePolarSector.Jet = ConstructionConicOracle.ellipse(
    3,
    2,
    0.3,
  );
  ConstructionConicOracle.compare(
    red,
    "made slope",
    [expected[0], expected[1] + 0.01, expected[2]],
    expected,
    1,
    2e-9,
  );
  if (red.length === 0)
    failures.push("a made0.01 slope error passed the projective reader");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} conic projective findings:\n${failures.join("\n")}`,
    );
}
