import { AutoMovieConstructionSplitSeam } from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionSplitSeam as S } from "../../internal/construction/ConstructionSplitSeam";

/**
 * A split with a curved seam realizes its two bands along the seam and the
 * host's arcs.
 *
 * Fixture: `ConstructionSplitSeam` (host end circle R = 25 sqrt(1 - (30 /
 * 80)^2) mm at z = -30 split along [0, pi], forks A = (R, 0, -30) and B = (-R,
 * 0, -30), seam plane y = 0, legs at y = +-0.0105 with rails 0.03 m, profile
 * knots [0.008, 0.005], [0.0232, 0.006], [0.0383, 0.005] m, corner pi / 8, 32
 * columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. No diagnostic; the faces are the host, both legs and both bands.
 * 2. Arc columns outside the corner window (2 <= k <= 14): the band copies the
 *    host's 2-jet (point within 1e-6 mm of the host's circle, cross direction
 *    and `uu / |u|^2` within 1e-9).
 * 3. Seam columns (17 <= k <= 31): the point lies in y = 0 within 1e-9 mm and on
 *    the seam within 1e-6 mm of `seam.at` at its arclength share; for 19 <= k
 *    <= 29 the cross direction is (0, 1, 0) for band a and (0, -1, 0) for band
 *    b within 1e-9 and the second derivative vanishes.
 * 4. Band a's chord column k is band b's 48 - k in the start cycles.
 */
export function test_engine_geometry_split_seam_bands(): void {
  const n: number = S.COLUMNS;
  const m: number = n / 2;
  const real: IAutoMovieConstructionRealization.IRealization = S.realize(
    S.split(S.profile()),
  );
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const names: string = real.body.faces
    .map((f: { chain: string }): string => f.chain)
    .sort((x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0))
    .join(",");
  TestValidator.equals("faces", names, "band.a,band.b,leg.a,leg.b,trunk");
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const seam = AutoMovieConstructionSplitSeam.create({
    host: trunk,
    station: 30,
    into: 1,
    seam: { startPhaseRad: 0, endPhaseRad: Math.PI },
    normal: [0, 0, -1],
    knots: S.KNOTS.map(({ alongM, depthM }) => ({
      alongMm: alongM * 1000,
      depthMm: depthM * 1000,
    })),
  });
  if (typeof seam === "string") throw new Error(`seam refused: ${seam}`);

  const seamSides: [string, number, boolean][] = [
    ["band.a", 1, true],
    ["band.b", -1, false],
  ];
  for (const [name, side, reversed] of seamSides) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    for (let k: number = m + 1; k < n; ++k) {
      const f: number = (k - m) / m;
      const b: IAutoMovieSolidSurface.IJet = band.jet(0, S.clock(k));
      TestValidator.predicate(
        `${name} seam ${k} plane`,
        Math.abs(b.p[1]) <= 1e-9,
      );
      TestValidator.predicate(
        `${name} seam ${k} on the seam`,
        S.len(S.sub(b.p, seam.at(reversed ? 1 - f : f).point)) <= 1e-6,
      );
      if (k >= m + 3 && k <= n - 3) {
        TestValidator.predicate(
          `${name} seam ${k} ruling`,
          S.off(b.u, [0, side, 0]) <= 1e-9,
        );
        TestValidator.predicate(
          `${name} seam ${k} second derivative`,
          S.len(b.uu) <= 1e-9,
        );
      }
    }
  }
  const arcs: [string, number][] = [
    ["band.a", 0],
    ["band.b", Math.PI],
  ];
  for (const [name, alpha] of arcs) {
    const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, name);
    for (let k: number = 2; k <= m - 2; ++k) {
      const phi: number = alpha + (Math.PI * k) / m;
      const b: IAutoMovieSolidSurface.IJet = band.jet(0, S.clock(k));
      const h: IAutoMovieSolidSurface.IJet = trunk.jet(30, phi);
      TestValidator.predicate(
        `${name} arc ${k} point`,
        S.len(S.sub(b.p, [S.R * Math.cos(phi), S.R * Math.sin(phi), -30])) <=
          1e-6,
      );
      TestValidator.predicate(
        `${name} arc ${k} direction`,
        S.off(b.u, h.u) <= 1e-9,
      );
      TestValidator.predicate(
        `${name} arc ${k} curvature`,
        S.len(S.sub(S.bend(b), S.bend(h))) <= 1e-9,
      );
    }
  }
  const cycle = (face: string, kind: string): number[] =>
    real.body.faces
      .find((f: { chain: string }): boolean => f.chain === face)
      ?.cycles.find((c: { kind: string }): boolean => c.kind === kind)
      ?.points ?? [];
  const startA: number[] = cycle("band.a", "start");
  const startB: number[] = cycle("band.b", "start");
  for (let k: number = m + 1; k < n; ++k)
    TestValidator.equals(`shared id ${k}`, startA[k], startB[3 * m - k]);
}
