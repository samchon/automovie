import { AutoMovieEngineSweep } from "@automovie/engine";
import type {
  AutoMovieSurfaceTier,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../../internal/sweepBottle";
import { sweepBranchedBody } from "../../internal/sweepBranchedBody";
import { sweepHoledNetwork } from "../../internal/sweepHoledNetwork";
import { sweepManifold } from "../../internal/sweepManifold";

/**
 * `sampleSurfaceNetwork` samples a surface network into a cage that is
 * a closed 2-manifold except at its declared rings, at every tier.
 *
 * Scenarios:
 *
 * 1. The bottle (Coons heel band, curve sides), the holed network and the branched
 *    body, at the lowest, low, medium and high tiers: every directed edge
 *    appears once, every edge borders one or two faces, the one-face edges are
 *    exactly the declared rings, and every vertex's faces form one fan.
 * 2. Dropping the bottle's rings leaves its mouth an undeclared opening, and the
 *    ring check reports it.
 * 3. Reshaping the branched body (breadth 1.15, branch 0.9) keeps every face, UV
 *    face, corner and ring of the cage at the lowest and high tiers while its
 *    target points move by more than 1e-3.
 * 4. The branched body, built mirror-symmetric across x = 0, samples at every
 *    tier to targets and controls whose mirror images are again targets and
 *    controls within 1e-9, through one involution that carries every face to a
 *    face of opposite winding: points shared by strips of different spacing
 *    are where an order-dependent rule would break it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names manifold cage and ring rules, undeclared mouth, geometry-only reshape and mirrored incidence across tiers.
 * @evidence contracts/development/testing.md#behavioral-verification Samples bottle, holed and branched surface networks and checks actual edges, vertices, UV topology and reflected controls.
 * @evidence contracts/development/testing.md#independent-expectations Each interior oriented edge must have its reverse and each single incidence must lie on a declared ring. Symmetric input requires a reflected involution that reverses face winding.
 */
export function test_engine_geometry_sweep_network(): void {
  const tiers: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];
  const bodies: [string, IAutoMovieSurfaceNetwork][] = [
    ["bottle", sweepBottle()],
    ["holed", sweepHoledNetwork()],
    ["branched", sweepBranchedBody()],
  ];
  for (const [name, network] of bodies)
    for (const tier of tiers)
      TestValidator.equals(
        `${name} ${tier}`,
        sweepManifold(AutoMovieEngineSweep.sampleSurfaceNetwork({ network, tier })),
        {
          wound: true,
          twoFaced: true,
          boundaryIsRings: true,
          fans: true,
        },
      );
  const open: IAutoMovieSurfaceNetwork = { ...sweepBottle(), rings: [] };
  TestValidator.equals(
    "undeclared opening",
    sweepManifold(AutoMovieEngineSweep.sampleSurfaceNetwork({ network: open, tier: "low" }))
      .boundaryIsRings,
    false,
  );
  const edges: AutoMovieSurfaceTier[] = ["lowest", "high"];
  const body: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const reshaped: IAutoMovieSurfaceNetwork = sweepBranchedBody({
    breadth: 1.15,
    branch: 0.9,
  });
  const topology = (cage: IAutoMovieSurfaceCage): string =>
    JSON.stringify([
      cage.cage.faces,
      cage.cage.uvFaces,
      cage.corners,
      cage.rings,
    ]);
  for (const tier of edges) {
    const a: IAutoMovieSurfaceCage = AutoMovieEngineSweep.sampleSurfaceNetwork({
      network: body,
      tier,
    });
    const b: IAutoMovieSurfaceCage = AutoMovieEngineSweep.sampleSurfaceNetwork({
      network: reshaped,
      tier,
    });
    TestValidator.equals(`topology ${tier}`, topology(a), topology(b));
    TestValidator.predicate(
      `points move ${tier}`,
      a.targets.some(
        (x: number, k: number): boolean => Math.abs(x - b.targets[k]!) > 1e-3,
      ),
    );
  }

  // 4.
  const canonical = (q: number[]): string => {
    const k: number = q.indexOf(Math.min(...q));
    return [0, 1, 2, 3].map((i: number): number => q[(k + i) % 4]!).join(",");
  };
  const mirror = (points: ArrayLike<number>): number[] | null => {
    const grid = (x: number, y: number, z: number): string =>
      `${Math.round(x * 1e7)},${Math.round(y * 1e7)},${Math.round(z * 1e7)}`;
    const at: Map<string, number> = new Map();
    for (let i: number = 0; i < points.length / 3; ++i)
      at.set(grid(points[3 * i]!, points[3 * i + 1]!, points[3 * i + 2]!), i);
    const map: number[] = [];
    for (let i: number = 0; i < points.length / 3; ++i) {
      const j: number | undefined = at.get(grid(-points[3 * i]!, points[3 * i + 1]!, points[3 * i + 2]!));
      if (j === undefined) return null;
      map.push(j);
    }
    return map;
  };
  const mirrored = (points: ArrayLike<number>, map: number[]): boolean =>
    map.every(
      (j: number, i: number): boolean =>
        Math.abs(points[3 * j]! + points[3 * i]!) <= 1e-9 &&
        Math.abs(points[3 * j + 1]! - points[3 * i + 1]!) <= 1e-9 &&
        Math.abs(points[3 * j + 2]! - points[3 * i + 2]!) <= 1e-9,
    );
  for (const tier of ["lowest", "low", "medium", "high"] satisfies AutoMovieSurfaceTier[]) {
    const cage: IAutoMovieSurfaceCage = AutoMovieEngineSweep.sampleSurfaceNetwork({ network: sweepBranchedBody(), tier });
    const map: number[] | null = mirror(cage.targets);
    if (map === null) throw new Error(`${tier}: a target has no mirror`);
    const faces: Set<string> = new Set(cage.cage.faces.map(canonical));
    TestValidator.predicate(`${tier} mirrored targets`, mirrored(cage.targets, map));
    TestValidator.predicate(`${tier} mirrored controls`, mirrored(cage.cage.positions, map));
    TestValidator.predicate(
      `${tier} mirrored faces`,
      map.every((j: number, i: number): boolean => map[j] === i) &&
        cage.cage.faces.every((q: number[]): boolean =>
          faces.has(canonical([q[3]!, q[2]!, q[1]!, q[0]!].map((v: number): number => map[v]!))),
        ),
    );
  }
}
