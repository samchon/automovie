import { AutoMovieEngineConstruction } from "@automovie/engine";
import type {
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshIncidence,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `probeAutoMovieSolidMesh` finds a point inside a boundary walk's face, beside
 * any of its edges, not only its first.
 *
 * Walk: the counter-clockwise square (0,1), (1,1), (1,2), (0,2).
 *
 * Scenarios:
 *
 * 1. With no other constraint, the probe stands inside the square.
 * 2. With a sliver constraint from (0.25, 1 + 2^-52) to (0.75, 1 + 2^-52), one
 *    unit in the last place above the first edge (no double lies between them),
 *    no probe beside the first edge is admitted: the probe still stands inside
 *    the square, and not between the first edge and the sliver.
 */
export function test_engine_geometry_solid_mesh_probe(): void {
  const square: [number, number][] = [
    [0, 1],
    [1, 1],
    [1, 2],
    [0, 2],
  ];
  const sliver: [number, number][] = [
    [0.25, 1 + 2 ** -52],
    [0.75, 1 + 2 ** -52],
  ];
  const cases: [string, [number, number][][]][] = [
    ["open square", []],
    ["sliver", [sliver]],
  ];
  for (const [name, extra] of cases) {
    const vertices: Map<number, [number, number]> = new Map();
    square.forEach(
      (p: [number, number], k: number): void => void vertices.set(k, p),
    );
    const edges: IAutoMovieSolidMeshConstraints.ISegment[] = square.map(
      (
        _: [number, number],
        k: number,
      ): IAutoMovieSolidMeshConstraints.ISegment => ({
        a: k,
        b: (k + 1) % 4,
        turn: 0,
      }),
    );
    for (const segment of extra) {
      const a: number = vertices.size;
      vertices.set(a, segment[0]!);
      vertices.set(a + 1, segment[1]!);
      edges.push({ a, b: a + 1, turn: 0 });
    }
    const walk: IAutoMovieSolidMeshIncidence.IWalk = {
      vertices: [0, 1, 2, 3],
      lifts: [0, 0, 0, 0],
      winding: 0,
    };
    const probe: readonly [number, number] | string = AutoMovieEngineConstruction.probeSolidMesh(
      vertices,
      edges,
      walk,
      undefined,
    );
    if (typeof probe === "string") {
      TestValidator.equals(`${name} refused`, probe, "");
      continue;
    }
    TestValidator.predicate(
      `${name} inside`,
      probe[0] > 0 && probe[0] < 1 && probe[1] > 1 && probe[1] < 2,
    );
    if (extra.length > 0)
      TestValidator.predicate(
        `${name} not between`,
        !(probe[1] <= 1 + 2 ** -52 && probe[0] >= 0.25 && probe[0] <= 0.75),
      );
  }
}
