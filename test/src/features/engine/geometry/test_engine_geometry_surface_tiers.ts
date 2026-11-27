import { AutoMovieEngineSweep } from "@automovie/engine";
import type {
  AutoMovieSurfaceTier,
  IAutoMovieSubdivisionParameter,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../../internal/sweepBottle";
import { sweepBranchedBody } from "../../internal/sweepBranchedBody";
import { throwsError } from "../../internal/throwsError";

/**
 * `mapSurfaceTier` carries a point bound to one tier's cage to another
 * tier through its surface coordinate (patch, s, t), and
 * `locateSurfaceCoordinate` admits such a coordinate.
 *
 * Fixture: the branched body's four tiers; 60 points spread over faces strictly
 * inside them (local coordinates in [0.02, 0.98]).
 *
 * Scenarios:
 *
 * 1. For every ordered pair of tiers, each point maps there and back to its own
 *    face within 1e-12, both maps reporting the same coordinate within 1e-15.
 * 2. A same-tier map is the identity, and a face's corner (1, 1) maps to its
 *    published corner coordinate.
 * 3. Tiers of different networks, a face out of range, u = 1.5, t = -0.1 and a
 *    patch the cage lacks are refused by their own diagnostics.
 */
export function test_engine_geometry_surface_tiers(): void {
  const tiers: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];
  const cages: IAutoMovieSurfaceCage[] = tiers.map((tier: AutoMovieSurfaceTier) =>
    AutoMovieEngineSweep.sampleSurfaceNetwork({ network: sweepBranchedBody(), tier }),
  );
  const points = (cage: IAutoMovieSurfaceCage): IAutoMovieSubdivisionParameter[] =>
    Array.from({ length: 60 }, (_: unknown, k: number) => ({
      face: Math.floor(((k * 0.6180339887) % 1) * cage.cage.faces.length),
      corner: null,
      u: 0.02 + 0.96 * ((k * 0.7548776662) % 1),
      v: 0.02 + 0.96 * ((k * 0.569840291) % 1),
    }));
  const same = (a: IAutoMovieSurfaceCoordinate, b: IAutoMovieSurfaceCoordinate): boolean =>
    a.patch === b.patch && Math.abs(a.s - b.s) <= 1e-15 && Math.abs(a.t - b.t) <= 1e-15;
  const home = (a: IAutoMovieSubdivisionParameter, b: IAutoMovieSubdivisionParameter): boolean =>
    a.face === b.face && Math.abs(a.u - b.u) <= 1e-12 && Math.abs(a.v - b.v) <= 1e-12;

  // 1.
  cages.forEach((from: IAutoMovieSurfaceCage, a: number): void =>
    cages.forEach((to: IAutoMovieSurfaceCage, b: number): void =>
      TestValidator.predicate(
        `${tiers[a]} to ${tiers[b]}`,
        points(from).every((at: IAutoMovieSubdivisionParameter): boolean => {
          const there = AutoMovieEngineSweep.mapSurfaceTier({ from, to, at });
          const back = AutoMovieEngineSweep.mapSurfaceTier({ from: to, to: from, at: there.at });
          return home(back.at, at) && same(there.coordinate, back.coordinate);
        }),
      ),
    ),
  );

  // 2.
  const medium: IAutoMovieSurfaceCage = cages[2]!;
  TestValidator.predicate(
    "identity and corners",
    points(medium).every((at: IAutoMovieSubdivisionParameter): boolean => {
      const corner = AutoMovieEngineSweep.mapSurfaceTier({ from: medium, to: medium, at: { face: at.face, corner: null, u: 1, v: 1 } });
      return home(AutoMovieEngineSweep.mapSurfaceTier({ from: medium, to: medium, at }).at, at) && same(corner.coordinate, medium.corners[at.face]![2]!);
    }),
  );

  // 3.
  const bottle: IAutoMovieSurfaceCage = AutoMovieEngineSweep.sampleSurfaceNetwork({ network: sweepBottle(), tier: "medium" });
  for (const [label, run, message] of [
    [
      "different networks",
      (): unknown => AutoMovieEngineSweep.mapSurfaceTier({ from: medium, to: bottle, at: { face: 0, corner: null, u: 0.5, v: 0.5 } }),
      "tiers must come from the same network",
    ],
    [
      "face out of range",
      (): unknown =>
        AutoMovieEngineSweep.mapSurfaceTier({ from: medium, to: cages[0]!, at: { face: medium.cage.faces.length, corner: null, u: 0.5, v: 0.5 } }),
      "is out of range",
    ],
    [
      "outside the face",
      (): unknown => AutoMovieEngineSweep.mapSurfaceTier({ from: medium, to: cages[0]!, at: { face: 0, corner: null, u: 1.5, v: 0.5 } }),
      "face coordinates must lie in 0 to 1",
    ],
    [
      "outside the patch",
      (): unknown => AutoMovieEngineSweep.locateSurfaceCoordinate({ cage: medium, coordinate: { patch: 0, s: 0.5, t: -0.1 } }),
      "surface coordinate s and t must lie in 0 to 1",
    ],
    [
      "missing patch",
      (): unknown => AutoMovieEngineSweep.locateSurfaceCoordinate({ cage: medium, coordinate: { patch: medium.patches.length, s: 0.5, t: 0.5 } }),
      "which the cage lacks",
    ],
  ] satisfies [string, () => unknown, string][])
    TestValidator.predicate(label, throwsError(run, message));
}
