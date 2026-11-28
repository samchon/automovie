import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieMeshSeparationResult,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * A resident separation query (`createMeshSeparationQuery`) certifies
 * that a complete feature (point, segment or face fan) clears the resident
 * mesh by a gap, keeping the limiting triangle's original ordinal and spending
 * one shared work budget; an attachment is admitted only for its real
 * support.
 *
 * Fixture: the resident triangle (0,0,0), (2,0,0), (0,2,0); the face above it
 * at z = 1.
 *
 * Scenarios:
 *
 * 1. The face above clears 0.5 on its bounding box alone (no limiting triangle,
 *    one unit of work); at its exact limit 1 it is not certified, with a lower
 *    bound in (1 - 1e-12, 1) at triangle 0.
 * 2. A segment crossing the triangle bounds to 0; gap 0 still certifies the face
 *    above but not a point on the triangle; a fan touching at its root and
 *    crossing elsewhere is not certified.
 * 3. Overwriting the source buffers changes nothing; a collapsed resident
 *    triangle acts as its point.
 * 4. Fourteen stacked sheets (two at z = 0) keep the lower original ordinal 0 and
 *    a lower bound in (0.5 - 1e-12, 0.5] for (0.25, 0.25, 0.5).
 * 5. Budgets 0 and 1 are exhausted ("exhausted") and stay spent at 0.
 * 6. An attachment fan around (0.5, 0.5, 0) on triangle 0 with weights (0.5,
 *    0.25, 0.25) is certified; supports naming only triangle 1, and a fan
 *    missing a point, are refused ("attachment"); with a second triangle across
 *    the edge, a fan at the shared edge's midpoint supported by both is
 *    certified.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names proof margin, complete features, ownership, ordinal ties, spent work and support admission.
 * @evidence contracts/development/testing.md#behavioral-verification Builds resident queries with real triangles, submits points or segments or fans, changes source buffers and compares support-certified or refused receipts.
 * @evidence contracts/development/testing.md#independent-expectations The parallel face is exactly 1 above the resident triangle. Touch and crossing have distance zero. The geometric support point is reconstructed from the written barycentrics.
 */
export function test_engine_geometry_mesh_separation(): void {
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
  const mesh: IAutoMovieMesh = { positions: [0, 0, 0, 2, 0, 0, 0, 2, 0], indices: [0, 1, 2], normals: [], uvs: [], skin: null };
  const query: IAutoMovieMeshSeparationQuery = AutoMovieEngineGeometry.createMeshSeparationQuery(mesh);
  const budget = { remaining: 100 };
  const above: IAutoMovieVector3[] = [p(0, 0, 1), p(2, 0, 1), p(0, 2, 1)];

  // 1.
  const proved: IAutoMovieMeshSeparationResult = query(above, { clearance: 0.5, budget });
  TestValidator.equals("box proof", [proved.certified, proved.triangle, budget.remaining], [true, -1, 99]);
  const exact: IAutoMovieMeshSeparationResult = query(above, { clearance: 1, budget });
  TestValidator.predicate(
    "exact limit",
    !exact.certified && exact.lowerBound < 1 && exact.lowerBound > 1 - 1e-12 && exact.triangle === 0,
  );

  // 2.
  TestValidator.equals("crossing", query([p(0.5, 0.5, -1), p(0.5, 0.5, 1)], { clearance: 0.1, budget }).lowerBound, 0);
  TestValidator.equals("gap 0 face", query(above, { clearance: 0, budget }).certified, true);
  TestValidator.equals("gap 0 contact", query([p(0, 0, 0)], { clearance: 0, budget }).certified, false);
  TestValidator.equals(
    "fan",
    query([p(0, 0, 0), p(0.5, 0.5, 1), p(1, 0.5, -1)], { clearance: 0.1, budget }).certified,
    false,
  );

  // 3.
  mesh.positions.fill(100);
  mesh.indices!.fill(0);
  TestValidator.equals("owned snapshot", query(above, { clearance: 0.5, budget }).certified, true);
  TestValidator.equals(
    "collapsed resident",
    AutoMovieEngineGeometry.createMeshSeparationQuery({ ...mesh, positions: [0, 0, 0, 0, 0, 0, 0, 0, 0], indices: [0, 1, 2] })(
      [p(1, 0, 0)],
      { clearance: 0.5, budget },
    ).certified,
    true,
  );

  // 4.
  const sheets: IAutoMovieMesh = { positions: [], indices: [], normals: [], uvs: [], skin: null };
  for (let at: number = 0; at < 14; at++) {
    const z: number = at === 0 || at === 13 ? 0 : (at - 7) * 10;
    sheets.positions.push(0, 0, z, 2, 0, z, 0, 2, z);
    sheets.indices!.push(3 * at, 3 * at + 1, 3 * at + 2);
  }
  const multi: IAutoMovieMeshSeparationResult = AutoMovieEngineGeometry.createMeshSeparationQuery(sheets)([p(0.25, 0.25, 0.5)], {
    clearance: 1,
    budget: { remaining: 100 },
  });
  TestValidator.predicate(
    "hierarchy",
    multi.triangle === 0 && multi.lowerBound > 0.5 - 1e-12 && multi.lowerBound <= 0.5,
  );

  // 5.
  const resident: IAutoMovieMeshSeparationQuery = AutoMovieEngineGeometry.createMeshSeparationQuery({
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  });
  for (const remaining of [0, 1]) {
    const short = { remaining };
    TestValidator.predicate(
      `budget ${remaining}`,
      throwsError((): unknown => resident(above, { clearance: 1, budget: short }), "exhausted"),
    );
    TestValidator.equals(`budget ${remaining} spent`, short.remaining, 0);
  }

  // 6.
  const fan: IAutoMovieVector3[] = [p(0.5, 0.5, 0), p(0.4, 0.5, 0.1), p(0.6, 0.5, 0.1)];
  const attach = (attachment: { triangle: number; weights: number[]; supports: number[] }) => ({
    clearance: 0,
    budget: { remaining: 1000 },
    attachment,
  });
  const own = { triangle: 0, weights: [0.5, 0.25, 0.25], supports: [0] };
  TestValidator.equals("attached", resident(fan, attach(own)).certified, true);
  TestValidator.predicate(
    "foreign support",
    throwsError((): unknown => resident(fan, attach({ ...own, supports: [1] })), "attachment"),
  );
  TestValidator.predicate("incomplete fan", throwsError((): unknown => resident(fan.slice(1), attach(own)), "attachment"));
  const double: IAutoMovieMeshSeparationQuery = AutoMovieEngineGeometry.createMeshSeparationQuery({
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0, 2, 2, 0],
    indices: [0, 1, 2, 1, 3, 2],
    normals: null,
    uvs: null,
    skin: null,
  });
  TestValidator.equals(
    "shared edge",
    double([p(1, 1, 0), p(0.9, 1, 0.1), p(1.1, 1, 0.1)], attach({ triangle: 0, weights: [0, 0.5, 0.5], supports: [0, 1] }))
      .certified,
    true,
  );
}
