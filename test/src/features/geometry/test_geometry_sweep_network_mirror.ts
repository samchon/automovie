import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/namedFacts";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";

const TIERS: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];

/** The vertex map of the mirror across `x = 0`, matching mirrored points within `tolerance`, or null when some point has no mirror. */
const mirrorMap = (points: number[], tolerance: number): number[] | null => {
  const count: number = points.length / 3;
  // points by coordinates rounded to a 1e-7 m grid, far coarser than the tolerance and far finer than the cage
  const grid = (x: number, y: number, z: number): string => `${Math.round(x * 1e7)},${Math.round(y * 1e7)},${Math.round(z * 1e7)}`;
  const at: Map<string, number> = new Map();
  for (let i: number = 0; i < count; ++i) at.set(grid(points[3 * i]!, points[3 * i + 1]!, points[3 * i + 2]!), i);
  const map: number[] = [];
  for (let i: number = 0; i < count; ++i) {
    const j: number | undefined = at.get(grid(-points[3 * i]!, points[3 * i + 1]!, points[3 * i + 2]!));
    if (
      j === undefined ||
      Math.abs(points[3 * j]! + points[3 * i]!) > tolerance ||
      Math.abs(points[3 * j + 1]! - points[3 * i + 1]!) > tolerance ||
      Math.abs(points[3 * j + 2]! - points[3 * i + 2]!) > tolerance
    )
      return null;
    map.push(j);
  }
  return map;
};

/** Whether the mirror map is an involution that carries every face onto a face wound the other way. */
const mirrorsFaces = (cage: IAutoMovieSurfaceCage, map: number[]): boolean => {
  const faces: Set<string> = new Set(cage.cage.faces.map((q: number[]): string => canonical(q)));
  return (
    map.every((j: number, i: number): boolean => map[j] === i) &&
    cage.cage.faces.every((q: number[]): boolean => faces.has(canonical([q[3]!, q[2]!, q[1]!, q[0]!].map((v: number): number => map[v]!))))
  );
};

/** A quad as a string independent of its starting corner. */
const canonical = (q: number[]): string => {
  const k: number = q.indexOf(Math.min(...q));
  return [0, 1, 2, 3].map((i: number): number => q[(k + i) % 4]!).join(",");
};

/**
 * A mirrored network samples to a mirrored cage at every tier, and a tier's
 * topology does not depend on the network's shape.
 *
 * Scenarios:
 *
 * 1. The branched body, built as a mirror image across `x = 0`, samples at
 *    every tier to targets and fitted controls whose mirror images are again
 *    targets and controls within 1e-9, through one involution that carries
 *    every face onto a face of opposite winding. Points shared by strips of
 *    different spacing are where an order-dependent rule would break it.
 * 2. Changing the branched body's breadth and branch size keeps the lowest
 *    and high tiers' faces, UV faces, face coordinates and ring vertices
 *    while moving its targets.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples the branched body with `sampleAutoMovieSurfaceNetwork` and matches each point to its mirror image; a rule that depends on patch order or on a sweep's handedness breaks the map, and shape-dependent topology changes the faces, while any symmetric, layout-determined sampling passes.
 * @evidence contracts/testing.md#independent-expectations The mirror image is computed in this test by negating `x`, and the face map by reversing each quad through the vertex map; invariance compares two samplings of one layout.
 * @evidence contracts/testing.md#distinguishing-cases Covers every tier, targets and fitted controls, every patch kind of the body, and a shape change that must move points but not topology; closure is owned by the network cage test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_network_mirror` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_network_mirror(): void {
  const body: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  TestValidator.equals(
    "the mirrored body samples to a mirrored cage at every tier",
    TIERS.map((tier: AutoMovieSurfaceTier): Record<string, boolean> => {
      const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: body, tier });
      const map: number[] | null = mirrorMap(cage.targets, 1e-9);
      return namedFacts([
        ["targets", (): boolean => map !== null],
        ["faces", (): boolean => mirrorsFaces(cage, map!)],
        [
          "controls",
          (): boolean =>
            map!.every(
              (j: number, i: number): boolean =>
                Math.abs(cage.cage.positions[3 * j]! + cage.cage.positions[3 * i]!) <= 1e-9 &&
                Math.abs(cage.cage.positions[3 * j + 1]! - cage.cage.positions[3 * i + 1]!) <= 1e-9 &&
                Math.abs(cage.cage.positions[3 * j + 2]! - cage.cage.positions[3 * i + 2]!) <= 1e-9,
            ),
        ],
      ]);
    }),
    TIERS.map((): Record<string, boolean> => ({ targets: true, faces: true, controls: true })),
  );

  const reshaped: IAutoMovieSurfaceNetwork = sweepBranchedBody({ breadth: 1.15, branch: 0.9 });
  TestValidator.equals(
    "a reshaped body keeps every tier's topology",
    (["lowest", "high"] as AutoMovieSurfaceTier[]).map((tier: AutoMovieSurfaceTier): boolean => {
      const a: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: body, tier });
      const b: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: reshaped, tier });
      return (
        JSON.stringify([a.cage.faces, a.cage.uvFaces, a.corners, a.rings]) === JSON.stringify([b.cage.faces, b.cage.uvFaces, b.corners, b.rings]) &&
        a.targets.some((x: number, k: number): boolean => Math.abs(x - b.targets[k]!) > 1e-3)
      );
    }),
    [true, true],
  );
}
