import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * A separation query (`createAutoMovieMeshSeparationQuery`) admits an
 * attachment only for the support it really sits on: a triangle, its
 * barycentric weights and the source triangles that support it.
 *
 * Fixture: the triangle (0,0,0), (2,0,0), (0,2,0); a three-point fan around
 * (0.5, 0.5, 0) attached to triangle 0 with weights (0.5, 0.25, 0.25).
 *
 * Scenarios:
 *
 * 1. The complete fan on its own triangle is certified.
 * 2. Supports naming only triangle 1, and a fan missing its first point, are
 *    refused ("attachment").
 * 3. With a second coplanar triangle across the edge (1,0)-(0,1) side, a fan at
 *    the shared edge's midpoint (1, 1, 0) with weights (0, 0.5, 0.5) and both
 *    triangles as supports is certified.
 */
export function test_unit_engine_geometry_mesh_separation_attachment(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const query: IAutoMovieMeshSeparationQuery = createAutoMovieMeshSeparationQuery(mesh);
  const fan: IAutoMovieVector3[] = [
    { x: 0.5, y: 0.5, z: 0 },
    { x: 0.4, y: 0.5, z: 0.1 },
    { x: 0.6, y: 0.5, z: 0.1 },
  ];
  const options = (attachment: { triangle: number; weights: number[]; supports: number[] }) => ({
    clearance: 0,
    budget: { remaining: 1000 },
    attachment,
  });
  const own = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };

  // 1.
  TestValidator.equals("certified", query(fan, options(own)).certified, true);

  // 2.
  TestValidator.predicate(
    "foreign support",
    throwsError((): unknown => query(fan, options({ ...own, supports: [1] })), "attachment"),
  );
  TestValidator.predicate(
    "incomplete fan",
    throwsError((): unknown => query(fan.slice(1), options(own)), "attachment"),
  );

  // 3.
  const double: IAutoMovieMeshSeparationQuery = createAutoMovieMeshSeparationQuery({
    ...mesh,
    positions: [...mesh.positions, 2, 2, 0],
    indices: [0, 1, 2, 1, 3, 2],
  });
  TestValidator.equals(
    "shared edge",
    double(
      [
        { x: 1, y: 1, z: 0 },
        { x: 0.9, y: 1, z: 0.1 },
        { x: 1.1, y: 1, z: 0.1 },
      ],
      options({ triangle: 0, weights: [0, 0.5, 0.5], supports: [0, 1] }),
    ).certified,
    true,
  );
}
