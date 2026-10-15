import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceCoordinate,
  locateAutoMovieSurfaceCoordinate,
  mapAutoMovieSurfaceTier,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../internal/sweepBottle";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { throwsError } from "../internal/throwsError";

const TIERS: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];

/**
 * Surface coordinates link tiers: a point bound to one tier's cage maps to
 * another tier and back to the same face and local coordinates, through the
 * same `(patch, s, t)`.
 *
 * Scenarios:
 *
 * 1. For every ordered pair of the branched body's four tiers, 60 points
 *    spread over faces of the first tier, strictly inside them, map to the
 *    second and back to their own face with local coordinates within 1e-12,
 *    and both maps report the same surface coordinate.
 * 2. Mapping within one tier returns the point itself, and the coordinate of
 *    a face corner is that corner's published coordinate.
 * 3. Tiers of different networks, a face out of range, local coordinates
 *    outside 0 to 1, and a coordinate outside its patch are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Maps points with `mapAutoMovieSurfaceTier` both ways between every tier pair and locates coordinates with `locateAutoMovieSurfaceCoordinate`; a mapping that rounded to the grid, swapped `s` and `t`, used the wrong patch or ignored a tier's counts fails the round trip, while any exact chart composition passes.
 * @evidence contracts/testing.md#independent-expectations The expected result of a round trip is the starting point itself, and a corner's coordinate is read from the cage's own published corners; neither depends on the mapping's arithmetic.
 * @evidence contracts/testing.md#distinguishing-cases Covers coarser to finer, finer to coarser and same-tier maps over sweep, Coons and bridge patches, corners, and each refusal; positions of the sampled tiers are owned by the network and rig tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_tiers` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_tiers(): void {
  const cages: IAutoMovieSurfaceCage[] = TIERS.map(
    (tier: AutoMovieSurfaceTier): IAutoMovieSurfaceCage =>
      sampleAutoMovieSurfaceNetwork({ network: sweepBranchedBody(), tier }),
  );
  const points = (
    cage: IAutoMovieSurfaceCage,
  ): Array<{ face: number; corner: null; u: number; v: number }> =>
    Array.from({ length: 60 }, (_: unknown, k: number) => ({
      face: Math.floor(((k * 0.6180339887) % 1) * cage.cage.faces.length),
      corner: null,
      u: 0.02 + 0.96 * ((k * 0.7548776662) % 1),
      v: 0.02 + 0.96 * ((k * 0.569840291) % 1),
    }));
  const close = (
    a: IAutoMovieSurfaceCoordinate,
    b: IAutoMovieSurfaceCoordinate,
  ): boolean =>
    a.patch === b.patch &&
    Math.abs(a.s - b.s) <= 1e-15 &&
    Math.abs(a.t - b.t) <= 1e-15;
  TestValidator.equals(
    "points round-trip between every pair of tiers",
    TIERS.flatMap((_: AutoMovieSurfaceTier, a: number): boolean[] =>
      TIERS.map((__: AutoMovieSurfaceTier, b: number): boolean =>
        points(cages[a]!).every((at): boolean => {
          const there = mapAutoMovieSurfaceTier({
            from: cages[a]!,
            to: cages[b]!,
            at,
          });
          const back = mapAutoMovieSurfaceTier({
            from: cages[b]!,
            to: cages[a]!,
            at: there.at,
          });
          return (
            back.at.face === at.face &&
            Math.abs(back.at.u - at.u) <= 1e-12 &&
            Math.abs(back.at.v - at.v) <= 1e-12 &&
            close(there.coordinate, back.coordinate)
          );
        }),
      ),
    ),
    TIERS.flatMap((): boolean[] => TIERS.map((): boolean => true)),
  );

  const medium: IAutoMovieSurfaceCage = cages[2]!;
  TestValidator.predicate(
    "a same-tier map is the identity and a corner maps to its published coordinate",
    points(medium).every((at): boolean => {
      const same = mapAutoMovieSurfaceTier({ from: medium, to: medium, at });
      const corner = mapAutoMovieSurfaceTier({
        from: medium,
        to: medium,
        at: { face: at.face, corner: null, u: 1, v: 1 },
      });
      return (
        same.at.face === at.face &&
        Math.abs(same.at.u - at.u) <= 1e-12 &&
        Math.abs(same.at.v - at.v) <= 1e-12 &&
        close(corner.coordinate, medium.corners[at.face]![2])
      );
    }),
  );

  const bottle: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: sweepBottle(),
    tier: "medium",
  });
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "different networks",
      (): unknown =>
        mapAutoMovieSurfaceTier({
          from: medium,
          to: bottle,
          at: { face: 0, corner: null, u: 0.5, v: 0.5 },
        }),
      "tiers must come from the same network",
    ],
    [
      "a face out of range",
      (): unknown =>
        mapAutoMovieSurfaceTier({
          from: medium,
          to: cages[0]!,
          at: { face: medium.cage.faces.length, corner: null, u: 0.5, v: 0.5 },
        }),
      "is out of range",
    ],
    [
      "local coordinates outside the face",
      (): unknown =>
        mapAutoMovieSurfaceTier({
          from: medium,
          to: cages[0]!,
          at: { face: 0, corner: null, u: 1.5, v: 0.5 },
        }),
      "face coordinates must lie in 0 to 1",
    ],
    [
      "a coordinate outside its patch",
      (): unknown =>
        locateAutoMovieSurfaceCoordinate({
          cage: medium,
          coordinate: { patch: 0, s: 0.5, t: -0.1 },
        }),
      "surface coordinate s and t must lie in 0 to 1",
    ],
    [
      "a patch the cage lacks",
      (): unknown =>
        locateAutoMovieSurfaceCoordinate({
          cage: medium,
          coordinate: { patch: medium.patches.length, s: 0.5, t: 0.5 },
        }),
      "which the cage lacks",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
