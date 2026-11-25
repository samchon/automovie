import { measureAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

type Gap = { triangle: number; minimum: number };

/**
 * `measureAutoMovieMeshClearance(front, back, axis)` reads, for each front
 * triangle whose projection overlaps the back, the least signed plane depth
 * difference back - front over the overlap; the extremum may sit at a crossed
 * edge, not a source vertex.
 *
 * Fixtures: front (-2,-1,0), (2,-1,0), (0,2,0) and back (-2,1,1), (0,-2,1),
 * (2,1,1), whose projections cross with every front vertex outside the back;
 * integer-depth unit patches for the spatial cases.
 *
 * Scenarios:
 *
 * 1. The back sloped to depth z = x reaches -4/3 at a crossed edge.
 * 2. Along x, y and z (axes permuted), the front lifted 0, 1 and 2 against the
 *    flat back reads 1 - lift, implicit or reversed indices alike; contact
 *    reads 0; the inputs stay unchanged.
 * 3. An empty front or back, the back moved 10 aside in either direction, and a
 *    triangle parallel to the axis have no reading.
 * 4. Thirteen patches at depths 4..16 spread 4 apart along x, then y: a front
 *    patch at 30 over the i-th reads 20 - i; a front in a gap reads nothing; a
 *    front touching a patch at one vertex reads 20; an enclosing front reads
 *    the deepest, 14, in either back order.
 * 5. Short positions, two indices, index 3 and index -1 refuse ("triangle
 *    buffers"); coordinates 1e308 overflow the projected area, depths +-1e308
 *    the arithmetic, and two 1e308-wide slivers the clipping.
 */
export function test_unit_engine_geometry_mesh_clearance(): void {
  const mesh = (points: number[][], indices: number[] | null = null): IAutoMovieMesh => ({
    positions: points.flat(),
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const reads = (label: string, gaps: Gap[], expected: number[]): void =>
    TestValidator.predicate(
      `${label}: ${JSON.stringify(gaps)}`,
      gaps.length === expected.length &&
        gaps.every((g: Gap, i: number): boolean => Math.abs(g.minimum - expected[i]!) < 1e-12),
    );
  const front: IAutoMovieMesh = mesh([
    [-2, -1, 0],
    [2, -1, 0],
    [0, 2, 0],
  ]);
  const back: IAutoMovieMesh = mesh([
    [-2, 1, 1],
    [0, -2, 1],
    [2, 1, 1],
  ]);
  const before: string = JSON.stringify([front, back]);

  // 1.
  const sloped: IAutoMovieMesh = {
    ...back,
    positions: back.positions.map((v: number, i: number): number => (i % 3 === 2 ? back.positions[i - 2]! : v)),
  };
  reads("crossed edge", measureAutoMovieMeshClearance(front, sloped, "z"), [-4 / 3]);

  // 2.
  for (const axis of ["x", "y", "z"] as const) {
    const permute = (m: IAutoMovieMesh, lift: number): number[][] =>
      [0, 1, 2].map((i: number): number[] => {
        const u: number = m.positions[3 * i]!;
        const v: number = m.positions[3 * i + 1]!;
        const d: number = m.positions[3 * i + 2]!;
        return axis === "x" ? [d + lift, u, v] : axis === "y" ? [v, d + lift, u] : [u, v, d + lift];
      });
    for (const lift of [0, 1, 2])
      for (const indices of [null, [2, 1, 0]])
        reads(
          `${axis} lift ${lift}`,
          measureAutoMovieMeshClearance(mesh(permute(front, lift), indices), mesh(permute(back, 0), indices), axis),
          [lift - 1],
        );
  }
  TestValidator.equals("inputs kept", JSON.stringify([front, back]), before);

  // 3.
  TestValidator.equals("empty back", measureAutoMovieMeshClearance(front, mesh([]), "z"), []);
  TestValidator.equals("empty front", measureAutoMovieMeshClearance(mesh([]), back, "z"), []);
  for (const [dx, dy] of [
    [10, 0],
    [0, 10],
    [0, -10],
    [-10, 0],
  ])
    TestValidator.equals(
      `aside ${dx},${dy}`,
      measureAutoMovieMeshClearance(
        front,
        { ...back, positions: back.positions.map((v: number, i: number): number => v + [dx!, dy!, 0][i % 3]!) },
        "z",
      ),
      [],
    );
  const parallel: IAutoMovieMesh = mesh([
    [0, 0, 0],
    [1, 0, 0],
    [0, 0, 1],
  ]);
  TestValidator.equals("parallel front", measureAutoMovieMeshClearance(parallel, back, "z"), []);
  TestValidator.equals("parallel back", measureAutoMovieMeshClearance(front, parallel, "z"), []);

  // 4.
  const patch = (x: number, y: number, z: number): number[][] => [
    [x, y, z],
    [x + 1, y, z],
    [x, y + 1, z],
  ];
  for (const spread of [0, 1]) {
    const at = (i: number, z: number): number[][] =>
      patch(spread === 0 ? 4 * i : 0, spread === 1 ? 4 * i : 0, z);
    const patches: number[][][] = Array.from({ length: 13 }, (_: unknown, k: number) => at(k - 6, k - 6 + 10));
    const population: IAutoMovieMesh = mesh(patches.flat());
    for (let i: number = -6; i <= 6; i++)
      reads(`${spread} patch ${i}`, measureAutoMovieMeshClearance(mesh(at(i, 30)), population, "z"), [20 - i]);
    TestValidator.equals("gap", measureAutoMovieMeshClearance(mesh(patch(2, 2, 30)), population, "z"), []);
    reads("vertex contact", measureAutoMovieMeshClearance(mesh(patch(1, 0, 30)), population, "z"), [20]);
    const enclosing: IAutoMovieMesh = mesh([
      [-100, -100, 30],
      [100, -100, 30],
      [0, 100, 30],
    ]);
    for (const resident of [population, mesh([...patches].reverse().flat())])
      reads("enclosing", measureAutoMovieMeshClearance(enclosing, resident, "z"), [14]);
  }

  // 5.
  const unit: IAutoMovieMesh = mesh(
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ],
    [0, 1, 2],
  );
  reads("contact", measureAutoMovieMeshClearance(unit, unit, "z"), [0]);
  for (const bad of [
    { ...unit, positions: [0, 0] },
    { ...unit, indices: [0, 1] },
    { ...unit, indices: [0, 1, 3] },
    { ...unit, indices: [0, 1, -1] },
  ])
    TestValidator.predicate(
      "buffers",
      throwsError((): unknown => measureAutoMovieMeshClearance(bad, unit, "z"), "triangle buffers"),
    );
  const scaled = (f: (v: number, i: number) => number): IAutoMovieMesh => ({
    ...unit,
    positions: unit.positions.map(f),
  });
  TestValidator.predicate(
    "area overflow",
    throwsError(
      (): unknown => measureAutoMovieMeshClearance({ ...unit, positions: [0, 0, 0, 1e308, 0, 0, 0, 1e308, 0] }, unit, "z"),
      "projected area",
    ),
  );
  TestValidator.predicate(
    "depth overflow",
    throwsError(
      (): unknown =>
        measureAutoMovieMeshClearance(
          scaled((v: number, i: number) => (i % 3 === 2 ? 1e308 : v)),
          scaled((v: number, i: number) => (i % 3 === 2 ? -1e308 : v)),
          "z",
        ),
      "arithmetic",
    ),
  );
  TestValidator.predicate(
    "clipping overflow",
    throwsError(
      (): unknown =>
        measureAutoMovieMeshClearance(
          { ...unit, positions: [-1e308, 0, 0, 0, 0, 0, -1e308, 1e-308, 0] },
          { ...unit, positions: [0, 0, 0, 1e308, 0, 0, 1e308, 1e-308, 0] },
          "z",
        ),
      "clipping",
    ),
  );
}
