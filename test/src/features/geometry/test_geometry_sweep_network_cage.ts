import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../internal/sweepBottle";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepHoledNetwork } from "../internal/sweepHoledNetwork";

const TIERS: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];

const undirected = (a: number, b: number): string =>
  a < b ? `${a},${b}` : `${b},${a}`;

/**
 * Whether a cage is a consistently wound 2-manifold whose boundary is
 * exactly its rings: every directed edge appears once, every undirected edge
 * borders one or two faces, the edges bordering one face are exactly the
 * rings' consecutive pairs, and each vertex's faces form one fan joined
 * through edges at the vertex.
 */
const manifold = (cage: IAutoMovieSurfaceCage): Record<string, boolean> => {
  const faces: number[][] = cage.cage.faces;
  const directed: Set<string> = new Set();
  const borders: Map<string, number> = new Map();
  let wound: boolean = true;
  faces.forEach((quad: number[]): void => {
    for (let k: number = 0; k < 4; ++k) {
      const key: string = `${quad[k]},${quad[(k + 1) % 4]}`;
      if (directed.has(key)) wound = false;
      directed.add(key);
      const edge: string = undirected(quad[k]!, quad[(k + 1) % 4]!);
      borders.set(edge, (borders.get(edge) ?? 0) + 1);
    }
  });
  const boundary: Set<string> = new Set(
    [...borders]
      .filter(([, n]: [string, number]): boolean => n === 1)
      .map(([e]: [string, number]): string => e),
  );
  const rings: Set<string> = new Set();
  for (const loop of Object.values(cage.rings))
    loop.forEach((v: number, k: number): void => {
      rings.add(undirected(v, loop[(k + 1) % loop.length]!));
    });
  const incident: number[][] = Array.from(
    { length: cage.targets.length / 3 },
    (): number[] => [],
  );
  faces.forEach((quad: number[], f: number): void =>
    quad.forEach((v: number): void => void incident[v]!.push(f)),
  );
  const fans: boolean = incident.every(
    (around: number[], v: number): boolean => {
      if (around.length === 0) return false;
      // faces at v meet through an edge at v when they share v and one more vertex
      const reached: Set<number> = new Set([around[0]!]);
      const queue: number[] = [around[0]!];
      while (queue.length > 0) {
        const f: number = queue.pop()!;
        for (const g of around)
          if (
            !reached.has(g) &&
            faces[f]!.some(
              (w: number): boolean =>
                w !== v &&
                faces[g]!.includes(w) &&
                borders.has(undirected(v, w)),
            )
          ) {
            reached.add(g);
            queue.push(g);
          }
      }
      return reached.size === around.length;
    },
  );
  return {
    wound,
    twoFaced: [...borders.values()].every(
      (n: number): boolean => n === 1 || n === 2,
    ),
    boundaryIsRings:
      boundary.size === rings.size &&
      [...boundary].every((e: string): boolean => rings.has(e)),
    fans,
  };
};

/**
 * Sampled cages of the test bodies are closed 2-manifolds except at their
 * declared rings at every tier.
 *
 * Scenarios:
 *
 * 1. The branched body, the bottle and the holed
 *    network, at all four tiers: every directed edge appears once, every
 *    edge borders one or two faces, the one-face edges are exactly the
 *    declared rings, and every vertex's faces form a single fan.
 * 2. A boundary missing a ring fails the manifold check: dropping the
 *    bottle's mouth ring leaves its mouth as an undeclared opening.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples networks with `sampleAutoMovieSurfaceNetwork` and inspects the cages; welding that missed a shared side leaves a one-face edge off any ring, overlapping or flipped patches repeat a directed edge, and a pinched vertex splits its fan, while any closed, consistently wound layout passes.
 * @evidence contracts/testing.md#independent-expectations The manifold, ring and fan conditions are computed in this test from the faces and the published rings alone.
 * @evidence contracts/testing.md#distinguishing-cases Covers sweep, Coons, bridge and curve patches, pinned and reported rings, every tier, guides and features, and the negative of an undeclared opening; symmetry and shape invariance are owned by the network mirror test and positions by the rig and Gordon tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_network_cage` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_network_cage(): void {
  const bodies: Array<[string, IAutoMovieSurfaceNetwork]> = [
    ["branched", sweepBranchedBody()],
    ["bottle", sweepBottle()],
    ["holed", sweepHoledNetwork()],
  ];
  for (const [name, network] of bodies)
    TestValidator.equals(
      `the ${name} cage is closed except at its rings at every tier`,
      TIERS.map(
        (tier: AutoMovieSurfaceTier): Record<string, boolean> =>
          manifold(sampleAutoMovieSurfaceNetwork({ network, tier })),
      ),
      TIERS.map(
        (): Record<string, boolean> => ({
          wound: true,
          twoFaced: true,
          boundaryIsRings: true,
          fans: true,
        }),
      ),
    );

  const open: IAutoMovieSurfaceNetwork = { ...sweepBottle(), rings: [] };
  TestValidator.equals(
    "an opening without a ring is caught",
    manifold(sampleAutoMovieSurfaceNetwork({ network: open, tier: "low" }))
      .boundaryIsRings,
    false,
  );
}
