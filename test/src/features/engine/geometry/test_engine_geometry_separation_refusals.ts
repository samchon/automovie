import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The separation bounds (`boundConvexSeparation`,
 * `boundProjectionSeparation`) and the resident query
 * (`createMeshSeparationQuery`) refuse unrepresentable arithmetic and
 * malformed work by name instead of returning a separation a consumer could
 * accept.
 *
 * Fixture: the unit right triangle as the resident mesh.
 *
 * Scenarios:
 *
 * 1. An empty feature ("finite vertex"), target -1 ("nonnegative"), an empty
 *    projection ("nonempty finite"), a projection difference of 2 MAX_VALUE
 *    ("representable"), an enclosure past finite range ("overflowing infinity")
 *    and an overflowing face ("face differences") refuse.
 * 2. An empty resident ("nonempty finite"), index 9 and sparse indices ("vertex"),
 *    and coordinates of 1e39, finite in binary64 but not in Float32 ("finite
 *    represented resident vertices"), refuse; the same coordinates in binary64
 *    are admitted.
 * 3. A point 1 above the resident with gap 0.5 and one unit of work is certified;
 *    negative or infinite clearance, noninteger or nonfinite budgets and
 *    malformed query vertices refuse. At zero clearance, a positive gap still
 *    certifies with the same one-unit charge. Invalid requests spend nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names arithmetic and work-limit refusal classes, float representation difference and positive and strict-zero controls, and validation before work spending.
 * @evidence contracts/development/testing.md#behavioral-verification Feeds malformed point sets and resident data to the public bound and query owners and checks the reported causes and normal control.
 * @evidence contracts/development/testing.md#independent-expectations Separating opposite maximum finite coordinates exceeds binary64 range, and 1e39 exceeds Float32 but fits binary64. A point one unit above the triangle exceeds the 0.5 target.
 */
export function test_engine_geometry_separation_refusals(): void {
  const p = (x: number, y: number = 0, z: number = 0): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const M: number = Number.MAX_VALUE;
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [],
    uvs: [],
    skin: null,
  };
  const refused = (label: string, run: () => unknown, message: string): void =>
    TestValidator.predicate(label, throwsError(run, message));

  // 1.
  refused(
    "empty feature",
    () => AutoMovieEngineGeometry.boundConvexSeparation([], [p(1)]),
    "finite vertex",
  );
  refused(
    "target -1",
    () => AutoMovieEngineGeometry.boundConvexSeparation([p(0)], [p(1)], -1),
    "nonnegative",
  );
  refused(
    "empty projection",
    () => AutoMovieEngineGeometry.boundProjectionSeparation([], [p(1)], p(1)),
    "nonempty finite",
  );
  refused(
    "projection overflow",
    () => AutoMovieEngineGeometry.boundProjectionSeparation([p(-M)], [p(M)], p(1)),
    "representable",
  );
  refused(
    "enclosure overflow",
    () => AutoMovieEngineGeometry.boundProjectionSeparation([p(0)], [p(M)], p(1)),
    "overflowing infinity",
  );
  refused(
    "face overflow",
    () => AutoMovieEngineGeometry.boundConvexSeparation([p(-M), p(M), p(0, 1)], [p(0)]),
    "face differences",
  );

  // 2.
  refused(
    "empty resident",
    () =>
      AutoMovieEngineGeometry.createMeshSeparationQuery({
        ...mesh,
        positions: [],
        indices: [],
      }),
    "nonempty finite",
  );
  refused(
    "index 9",
    () => AutoMovieEngineGeometry.createMeshSeparationQuery({ ...mesh, indices: [0, 1, 9] }),
    "vertex",
  );
  refused(
    "sparse indices",
    () =>
      AutoMovieEngineGeometry.createMeshSeparationQuery({ ...mesh, indices: new Array(3) }),
    "vertex",
  );
  refused(
    "nonfinite resident positions",
    () => AutoMovieEngineGeometry.createMeshSeparationQuery({
      ...mesh, positions: [...mesh.positions, NaN, 0, 0],
    }),
    "finite represented resident vertices",
  );
  const beyond: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.map((v: number): number => v * 1e39),
  };
  AutoMovieEngineGeometry.createMeshSeparationQuery(beyond);
  refused(
    "beyond Float32",
    () => AutoMovieEngineGeometry.createMeshSeparationQuery(beyond, "float32"),
    "finite represented resident vertices",
  );

  // 3.
  const query: IAutoMovieMeshSeparationQuery =
    AutoMovieEngineGeometry.createMeshSeparationQuery(mesh);
  TestValidator.equals(
    "certified",
    query([p(0, 0, 1)], { clearance: 0.5, budget: { remaining: 1 } }).certified,
    true,
  );
  refused(
    "clearance -1",
    () => query([p(0, 0, 1)], { clearance: -1, budget: { remaining: 10 } }),
    "nonnegative finite",
  );
  refused(
    "budget -1",
    () => query([p(0, 0, 1)], { clearance: 0.5, budget: { remaining: -1 } }),
    "safe-integer",
  );
  const validBudget = { remaining: 1 };
  TestValidator.equals(
    "positive gap certifies at zero clearance",
    [query([p(0, 0, 1)], { clearance: 0, budget: validBudget }).certified, validBudget.remaining],
    [true, 0],
  );
  for (const clearance of [NaN, Infinity]) {
    const budget = { remaining: 5 };
    refused("nonfinite clearance", () => query([p(0, 0, 1)], { clearance, budget }), "nonnegative finite");
    TestValidator.equals("bad clearance leaves budget", budget.remaining, 5);
  }
  for (const remaining of [0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const budget = { remaining };
    refused("invalid budget value", () => query([p(0, 0, 1)], { clearance: 0.5, budget }), "safe-integer");
    TestValidator.predicate("invalid budget is untouched", Object.is(budget.remaining, remaining));
  }
  for (const z of [NaN, Infinity]) {
    const budget = { remaining: 5 };
    refused(
      "nonfinite query coordinate",
      () => query([p(0, 0, z)], { clearance: 0.5, budget }),
      "finite query",
    );
    TestValidator.equals("bad query coordinates leave budget", budget.remaining, 5);
  }
  refused(
    "empty query",
    () => query([], { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
  refused(
    "sparse query",
    () => query(new Array(3), { clearance: 0.5, budget: { remaining: 10 } }),
    "finite query",
  );
}
