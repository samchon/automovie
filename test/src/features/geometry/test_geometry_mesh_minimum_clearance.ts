import {
  measureAutoMovieMeshClearance,
  minimizeAutoMovieMeshClearance,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

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
 */
export const test_geometry_mesh_minimum_clearance = (): void => {
  const mesh = (
    positions: number[],
    indices: number[] | null = null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const frontPoints = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ];
  const backPoints = [
    [0, 0, 0],
    [1, 0, 1],
    [0, 1, 0],
  ];
  for (const axis of ["x", "y", "z"] as const) {
    const axes = { x: [2, 0, 1], y: [1, 2, 0], z: [0, 1, 2] }[axis];
    const rotate = (points: number[][]) =>
      points.flatMap((p) => axes.map((i) => p[i]));
    const front = mesh(rotate(frontPoints)),
      back = mesh(rotate(backPoints));
    const original = structuredClone([front, back]);
    for (const clearance of [0, 0.25]) {
      const targets = minimizeAutoMovieMeshClearance(
        front,
        back,
        axis,
        clearance,
      );
      TestValidator.equals(
        "three incident vertex targets",
        targets.map((t) => t.vertex),
        [0, 1, 2],
      );
      TestValidator.predicate(
        "corner-derived minimum",
        targets.every(
          (t, i) =>
            Math.abs(t.distance - (i === 1 ? 1 + clearance : clearance)) < 1e-6,
        ),
      );
      const displaced = structuredClone(front);
      const depth = { x: 0, y: 1, z: 2 }[axis];
      for (const { vertex, distance } of targets)
        displaced.positions[3 * vertex + depth] += distance;
      TestValidator.predicate(
        "complete triangles retain clearance",
        measureAutoMovieMeshClearance(displaced, back, axis).every(
          (r) => r.minimum >= clearance - 1e-6,
        ),
      );
    }
    TestValidator.equals("caller buffers retained", [front, back], original);
  }
  const front = mesh(
    [...frontPoints.flat(), 10, 10, 0, 11, 10, 0, 10, 11, 0],
    [0, 1, 2, 3, 4, 5],
  );
  const back = mesh(backPoints.flat());
  const result = minimizeAutoMovieMeshClearance(front, back, "z");
  TestValidator.equals(
    "disjoint patch owns no target",
    result.map((r) => r.vertex),
    [0, 1, 2],
  );
  const clearOverlap = mesh([
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
      (r) => r.vertex,
    ),
    [0, 1, 2],
  );
  const clear = mesh(frontPoints.map(([x, y]) => [x, y, 2]).flat());
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
  measureAutoMovieMeshClearance(
    mesh(frontPoints.flat()),
    back,
    "z",
    (witness) => {
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
  TestValidator.equals("independent affine corner witnesses", seen, [
    [1, 0, 0, 0],
    [0, 1, 0, -1],
    [0, 0, 1, 0],
  ]);
  for (const clearance of [-1, NaN, Infinity])
    TestValidator.predicate(
      "invalid clearance domain",
      throwsError(
        () => minimizeAutoMovieMeshClearance(front, back, "z", clearance),
        "nonnegative",
      ),
    );
};
