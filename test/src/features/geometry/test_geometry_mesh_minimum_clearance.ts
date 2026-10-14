import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshClearanceWitness } from "../../../../packages/engine/src/geometry/IAutoMovieMeshClearanceWitness";
import { measureAutoMovieMeshClearance } from "../../../../packages/engine/src/geometry/measureAutoMovieMeshClearance";
import { minimizeAutoMovieMeshClearance } from "../../../../packages/engine/src/geometry/minimizeAutoMovieMeshClearance";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A tilted plane under a flat triangle needs unequal vertex travel. At the
 * independent corners the constraint is z>=x+clearance, giving (c,1+c,c).
 * Whole-face maximum correction would unnecessarily move all three by 1+c.
 *
 * Scenarios:
 * 1. Every positive depth axis produces the corner-derived minimum and keeps
 *    transverse positions and all input buffers unchanged.
 * 2. Indexed disjoint and clear overlapping patches stay fixed, as do wholly
 *    clear and empty input. Clear witnesses survive elimination of fixed vertices.
 * 3. The optional contact visitor exposes original barycentric corner witnesses;
 *    mutating retained witness arrays cannot change either input mesh.
 * 4. Invalid clearance is refused beside exact-zero admitted clearance.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes minimum-clearance optimization and applies its travel to the existing mesh, checking independently derived vertex targets, complete projected-face gaps, untouched transverse/caller data, fixed/disjoint/empty populations and copied barycentric visitor records. Invalid clearances must refuse beside admitted zero.
 * @evidence contracts/testing.md#independent-expectations The tilted plane has z=x, so nonnegative travel meeting gap c minimizes at (c,1+c,c) for the authored corners; affine corner weights and gaps follow their coordinates. Target agreement retains 1e-6 and the post-displacement clearance bound. These local optimality checks do not prove the solver generally or certify final Float32/GPU geometry.
 * @evidence contracts/testing.md#distinguishing-cases Retains all depth axes, zero/.25 gap, indexed disjoint and clear patches, fixed-vertex elimination, wholly clear/empty input, visitor ordinals/weights ownership and negative/NaN/infinite clearance refusals. General scheduler convergence and malformed projected arithmetic belong to their own entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable geometry entry reaches the actual pinned Clarabel WebAssembly reactor through quadratic source for active optimization, with portable clearance observation around it. It builds no native artifact, installs no consumer and starts no external process, browser or GPU; it registers no new cases.
 */
export function test_geometry_mesh_minimum_clearance(): void {
  const mesh: (
    positions: number[],
    indices?: number[] | null,
  ) => IAutoMovieMesh = (
    positions: number[],
    indices: number[] | null = null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const frontPoints: number[][] = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ];
  const backPoints: number[][] = [
    [0, 0, 0],
    [1, 0, 1],
    [0, 1, 0],
  ];
  for (const axis of ["x", "y", "z"] as const) {
    const axes: number[] = { x: [2, 0, 1], y: [1, 2, 0], z: [0, 1, 2] }[axis];
    const rotate: (points: number[][]) => number[] = (
      points: number[][],
    ): number[] =>
      points.flatMap((p: number[]): number[] =>
        axes.map((i: number): number => p[i]),
      );
    const front: IAutoMovieMesh = mesh(rotate(frontPoints)),
      back: IAutoMovieMesh = mesh(rotate(backPoints));
    const original: IAutoMovieMesh[] = structuredClone([front, back]);
    for (const clearance of [0, 0.25]) {
      const targets: { vertex: number; distance: number }[] =
        minimizeAutoMovieMeshClearance(front, back, axis, clearance);
      TestValidator.equals(
        "three incident vertex targets",
        targets.map(
          (t: { vertex: number; distance: number }): number => t.vertex,
        ),
        [0, 1, 2],
      );
      TestValidator.predicate(
        "corner-derived minimum",
        targets.every(
          (t: { vertex: number; distance: number }, i: number): boolean =>
            nclose(
              t.distance - (i === 1 ? 1 + clearance : clearance),
              0,
              1e-6,
            ) &&
            Math.abs(t.distance - (i === 1 ? 1 + clearance : clearance)) < 1e-6,
        ),
      );
      const displaced: IAutoMovieMesh = structuredClone(front);
      const depth: number = { x: 0, y: 1, z: 2 }[axis];
      for (const { vertex, distance } of targets)
        displaced.positions[3 * vertex + depth] += distance;
      const measured: ReturnType<typeof measureAutoMovieMeshClearance> =
        measureAutoMovieMeshClearance(displaced, back, axis);
      TestValidator.predicate(
        "complete triangles retain clearance",
        measured.length === 1 &&
          measured.every(
            (r: { triangle: number; minimum: number }): boolean =>
              r.minimum >= clearance - 1e-6,
          ),
      );
    }
    TestValidator.predicate(
      "caller buffers retained",
      equalGeometryTestValues([front, back], original),
    );
  }
  const front: IAutoMovieMesh = mesh(
    [...frontPoints.flat(), 10, 10, 0, 11, 10, 0, 10, 11, 0],
    [0, 1, 2, 3, 4, 5],
  );
  const back: IAutoMovieMesh = mesh(backPoints.flat());
  const result: { vertex: number; distance: number }[] =
    minimizeAutoMovieMeshClearance(front, back, "z");
  TestValidator.equals(
    "disjoint patch owns no target",
    result.map((r: { vertex: number; distance: number }): number => r.vertex),
    [0, 1, 2],
  );
  const clearOverlap: IAutoMovieMesh = mesh([
    ...back.positions,
    10,
    10,
    -1,
    11,
    10,
    -1,
    10,
    11,
    -1,
  ]);
  TestValidator.equals(
    "clear overlapping patch retains its fixed vertices",
    minimizeAutoMovieMeshClearance(front, clearOverlap, "z").map(
      (r: { vertex: number; distance: number }): number => r.vertex,
    ),
    [0, 1, 2],
  );
  const clear: IAutoMovieMesh = mesh(
    frontPoints.map(([x, y]: number[]): number[] => [x, y, 2]).flat(),
  );
  TestValidator.equals(
    "clear triangle needs no travel",
    minimizeAutoMovieMeshClearance(clear, back, "z"),
    [],
  );
  TestValidator.equals(
    "empty surface needs no travel",
    minimizeAutoMovieMeshClearance(mesh([]), back, "z"),
    [],
  );
  const seen: number[][] = [];
  const visitorFront: IAutoMovieMesh = mesh(frontPoints.flat());
  const visitorInputs: IAutoMovieMesh[] = structuredClone([visitorFront, back]);
  measureAutoMovieMeshClearance(
    visitorFront,
    back,
    "z",
    (witness: IAutoMovieMeshClearanceWitness): void => {
      TestValidator.equals(
        "source triangle ordinals",
        [witness.triangle, witness.backTriangle],
        [0, 0],
      );
      TestValidator.equals(
        "original vertex ordinals",
        witness.vertices,
        [0, 1, 2],
      );
      seen.push([...witness.weights, witness.gap]);
      witness.vertices[0] = 99;
      witness.weights[0] = 99;
    },
  );
  TestValidator.predicate(
    "independent affine corner witnesses",
    equalGeometryTestValues(seen, [
      [1, 0, 0, 0],
      [0, 1, 0, -1],
      [0, 0, 1, 0],
    ]),
  );
  TestValidator.predicate(
    "retained witness mutation preserves both inputs",
    equalGeometryTestValues([visitorFront, back], visitorInputs),
  );
  for (const clearance of [-1, NaN, Infinity])
    TestValidator.predicate(
      "invalid clearance domain",
      throwsError(
        (): { vertex: number; distance: number }[] =>
          minimizeAutoMovieMeshClearance(front, back, "z", clearance),
        "nonnegative",
      ),
    );
}
