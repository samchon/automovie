import type {
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionSplitSeam as S } from "../../internal/construction/ConstructionSplitSeam";

/**
 * Where a curved seam leaves a fork, each band meets the host G1; the straight
 * chord leaves a crease.
 *
 * Fixture: `ConstructionSplitSeam` (host end circle R = 25 sqrt(1 - (30 /
 * 80)^2) mm at z = -30 split along [0, pi], forks A = (R, 0, -30) and B = (-R,
 * 0, -30), seam plane y = 0, legs at y = +-0.0105 with rails 0.03 m, profile
 * knots [0.008, 0.005], [0.0232, 0.006], [0.0383, 0.005] m, corner pi / 8, 32
 * columns, 4 rows).
 *
 * Scenarios:
 *
 * 1. Band a's cross direction at the fork columns 0 and 16 is the inward diagonal
 *    (d + y_a) / sqrt 2, with d the host's realized station direction out of
 *    the end and y_a = (0, 1, 0) the ruling toward band a's arc, within 1e-9;
 *    and the band's normal agrees with the host's within 1 degree (the strip is
 *    refined so each one-sided chord deviates from its side's tangent by at
 *    most half a degree).
 * 2. Without a profile (the straight chord) the same reading at column 0 exceeds
 *    20 degrees.
 */
export function test_engine_geometry_split_seam_fork(): void {
  const m: number = S.COLUMNS / 2;
  const real: IAutoMovieConstructionRealization.IRealization = S.realize(
    S.split(S.profile()),
  );
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const band: IAutoMovieSolidSurface = ConstructionRead.surface(real, "band.a");
  const corners: [number, number][] = [
    [0, 0],
    [m, Math.PI],
  ];
  for (const [k, phi] of corners) {
    const diagonal: S.V3 = S.unit(trunk.jet(30, phi).u);
    diagonal[1] += 1;
    TestValidator.predicate(
      `column ${k} diagonal`,
      S.off(band.jet(0, S.clock(k)).u, diagonal) <= 1e-9,
    );
    TestValidator.predicate(
      `column ${k} normals`,
      S.fork(real, "band.a", k, phi) < 1,
    );
  }
  const straight: IAutoMovieConstructionRealization.IRealization = S.realize(
    S.split(undefined),
  );
  TestValidator.predicate(
    "straight chord crease",
    S.fork(straight, "band.a", 0, 0) > 20,
  );
}
