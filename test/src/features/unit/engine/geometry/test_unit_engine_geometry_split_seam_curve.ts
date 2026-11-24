import { AutoMovieConstructionSplitSeam } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../../internal/construction/ConstructionRead";
import { ConstructionSplitSeam as S } from "../../../internal/construction/ConstructionSplitSeam";

/**
 * `AutoMovieConstructionSplitSeam.create` builds a curved seam on a realized
 * host that leaves both forks along the host's own surface.
 *
 * Fixture: `ConstructionSplitSeam` (host end circle R = 25 sqrt(1 - (30 /
 * 80)^2) mm at z = -30 split along [0, pi], forks A = (R, 0, -30) and B = (-R,
 * 0, -30), seam plane y = 0, legs at y = +-0.0105 with rails 0.03 m, profile
 * knots [0.008, 0.005], [0.0232, 0.006], [0.0383, 0.005] m, corner pi / 8, 32
 * columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. The seam's ends are A and B within 1e-9 mm; its tangent at A is the host's
 *    station direction out of the end read on the host's realized surface (in y
 *    = 0, within 0.05 of the closed form (r'(s), 0, -1) with r'(0.03) = -0.025
 *    (0.03 / 0.08^2) / sqrt(1 - (0.03 / 0.08)^2)), and at B the reverse of the
 *    host's, within 1e-9.
 * 2. It passes through every knot (nearest of 401 shares refined by 60
 *    golden-section steps, within 1e-6 mm), and every point lies in y = 0
 *    within 1e-9 mm.
 */
export function test_unit_engine_geometry_split_seam_curve(): void {
  const real: IAutoMovieConstructionRealization.IRealization = S.realize(
    S.split(S.profile()),
  );
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const seam: IAutoMovieConstructionSplitSeam.ISeam | string =
    AutoMovieConstructionSplitSeam.create({
      host: trunk,
      station: 30,
      into: 1,
      seam: [0, Math.PI],
      normal: [0, 0, -1],
      knots: S.KNOTS.map(([a, d]: [number, number]): [number, number] => [
        a * 1000,
        d * 1000,
      ]),
    });
  if (typeof seam === "string") throw new Error(`seam refused: ${seam}`);
  const A: S.V3 = [S.R, 0, -30];
  const B: S.V3 = [-S.R, 0, -30];
  TestValidator.predicate("end A", S.len(S.sub(seam.at(0).point, A)) <= 1e-9);
  TestValidator.predicate("end B", S.len(S.sub(seam.at(1).point, B)) <= 1e-9);
  const outA: S.V3 = S.unit(trunk.jet(30, 0).u);
  const outB: S.V3 = S.unit(trunk.jet(30, Math.PI).u);
  TestValidator.predicate(
    "symmetric fork directions",
    Math.abs(outA[1]) <= 1e-12 && Math.abs(outB[1]) <= 1e-12,
  );
  TestValidator.predicate(
    "fork direction near the closed form",
    S.off(outA, [S.SLOPE, 0, -1]) < 0.05,
  );
  TestValidator.predicate(
    "tangent at A",
    S.off(seam.at(0).tangent, outA) <= 1e-9,
  );
  TestValidator.predicate(
    "tangent at B",
    S.off(seam.at(1).tangent, S.scaled(outB, -1)) <= 1e-9,
  );
  const samples: S.V3[] = Array.from(
    { length: 401 },
    (_: unknown, i: number): S.V3 => seam.at(i / 400).point,
  );
  TestValidator.predicate(
    "seam stays in its plane",
    samples.every((p: S.V3): boolean => Math.abs(p[1]) <= 1e-9),
  );
  for (const [along, depth] of S.KNOTS) {
    const knot: S.V3 = [S.R - along * 1000, 0, -30 - depth * 1000];
    const distance = (t: number): number =>
      S.len(S.sub(seam.at(t).point, knot));
    let best: number = 0;
    samples.forEach((p: S.V3, i: number): void => {
      if (S.len(S.sub(p, knot)) < S.len(S.sub(samples[best]!, knot))) best = i;
    });
    let lo: number = Math.max(0, (best - 1) / 400);
    let hi: number = Math.min(1, (best + 1) / 400);
    const g: number = (Math.sqrt(5) - 1) / 2;
    for (let i: number = 0; i < 60; ++i) {
      const x1: number = hi - g * (hi - lo);
      const x2: number = lo + g * (hi - lo);
      if (distance(x1) < distance(x2)) hi = x2;
      else lo = x1;
    }
    TestValidator.predicate(
      `knot (${along}, ${depth})`,
      distance((lo + hi) / 2) <= 1e-6,
    );
  }
}
