import { AutoMoviePolarSector } from "@automovie/engine";
import type { IAutoMoviePolarSector } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `AutoMoviePolarSector.radius(guides, fullness, phi)` is a closed section's
 * radius jet: between guides the quintic Hermite of both guides' (rho, rho',
 * rho'') plus the sector's fullness times 64 xi^3 (1 - xi)^3; `fullnessAt`
 * inverts the rule at a sector's middle and `point` lifts a jet to the (x, z)
 * chart.
 *
 * Fixture: guides at 0, pi/2, pi and 3 pi/2 with values 2, 1, 1.5, 1, slopes
 * 0.3, -0.2, 0, 0.1 and curvatures -1, 0.5, 0, 2; fullness 0.1, 0, -0.2, 0.05.
 *
 * Scenarios:
 *
 * 1. At each guide the jet is the guide's own (value, slope, curvature), and a
 *    whole turn later the same.
 * 2. Just below each guide the jet meets it within 1e-6 (C2 across guides).
 * 3. Inside a sector the slope and curvature are the central differences of the
 *    value and slope within 1e-6.
 * 4. At the middle of sector 0 the radius rises by exactly its fullness over the
 *    unfilled rule, and `fullnessAt` returns the fullness that puts it at 1.9.
 * 5. Guides of radius 1 with no slope, curvature or fullness give the unit circle.
 * 6. `point` of the jet (2, 0, 0) at pi/2 is (0, 2), (-2, 0), (0, -2).
 * 7. One guide is refused, and so is a sector of no width (a guide without an
 *    angle). The bisection over the guides only ever selects a sector of
 *    positive width from guides given in increasing order, so that refusal
 *    guards the angles themselves.
 */
export function test_unit_engine_geometry_polar_sector(): void {
  const angles: number[] = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const guides: IAutoMoviePolarSector.IGuide[] = angles.map(
    (angle: number, i: number) => ({
      angle,
      value: [2, 1, 1.5, 1][i]!,
      slope: [0.3, -0.2, 0, 0.1][i]!,
      curvature: [-1, 0.5, 0, 2][i]!,
    }),
  );
  const fullness: number[] = [0.1, 0, -0.2, 0.05];
  const jet = (phi: number): IAutoMoviePolarSector.Jet =>
    AutoMoviePolarSector.radius(guides, fullness, phi);
  const near = (
    a: readonly number[],
    b: readonly number[],
    e: number,
  ): boolean =>
    a.every((x: number, i: number): boolean => Math.abs(x - b[i]!) <= e);

  // 1. and 2.
  guides.forEach((g: IAutoMoviePolarSector.IGuide, i: number): void => {
    const own: number[] = [g.value, g.slope, g.curvature];
    TestValidator.predicate(
      `guide ${i}`,
      near(jet(g.angle), own, 1e-12) &&
        near(jet(g.angle + 2 * Math.PI), own, 1e-12),
    );
    TestValidator.predicate(`below ${i}`, near(jet(g.angle - 1e-9), own, 1e-6));
  });

  // 3.
  const h: number = 1e-5;
  for (const phi of [0.4, 2.1, 3.9, 5.5]) {
    const [, d1, d2] = jet(phi);
    TestValidator.predicate(
      `derivatives ${phi}`,
      Math.abs((jet(phi + h)[0] - jet(phi - h)[0]) / (2 * h) - d1) <= 1e-6 &&
        Math.abs((jet(phi + h)[1] - jet(phi - h)[1]) / (2 * h) - d2) <= 1e-6,
    );
  }

  // 4.
  const middle: number = Math.PI / 4;
  const bare: number = AutoMoviePolarSector.radius(
    guides,
    [0, 0, -0.2, 0.05],
    middle,
  )[0];
  TestValidator.predicate(
    "fullness",
    Math.abs(jet(middle)[0] - bare - 0.1) <= 1e-12,
  );
  const f: number = AutoMoviePolarSector.fullnessAt(
    guides[0]!,
    guides[1]!,
    Math.PI / 2,
    1.9,
  );
  TestValidator.predicate(
    "fullness at",
    Math.abs(
      AutoMoviePolarSector.radius(guides, [f, 0, -0.2, 0.05], middle)[0] - 1.9,
    ) <= 1e-12,
  );

  // 5.
  const round: IAutoMoviePolarSector.IGuide[] = angles.map((angle: number) => ({
    angle,
    value: 1,
    slope: 0,
    curvature: 0,
  }));
  TestValidator.predicate(
    "circle",
    [0.3, 1.9, 4.4].every((phi: number): boolean =>
      near(
        AutoMoviePolarSector.radius(round, [0, 0, 0, 0], phi),
        [1, 0, 0],
        1e-12,
      ),
    ),
  );

  // 6.
  TestValidator.predicate(
    "point",
    AutoMoviePolarSector.point([2, 0, 0], Math.PI / 2).every(
      (v: number[], k: number): boolean =>
        near(
          v,
          [
            [0, 2],
            [-2, 0],
            [0, -2],
          ][k]!,
          1e-12,
        ),
    ),
  );

  // 7.
  TestValidator.predicate(
    "one guide",
    throwsError(
      (): unknown => AutoMoviePolarSector.radius(guides.slice(0, 1), [0], 0),
      "needs two guides",
    ),
  );
  TestValidator.predicate(
    "no angle",
    throwsError(
      (): unknown =>
        AutoMoviePolarSector.radius(
          [guides[0]!, { ...guides[1]!, angle: NaN }],
          [0, 0],
          1,
        ),
      "must increase within one turn",
    ),
  );
}
