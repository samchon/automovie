import {
  boundAutoMovieConvexSeparation,
  boundAutoMovieProjectionSeparation,
  createAutoMovieMeshSeparationQuery,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The separation bounds (`boundAutoMovieConvexSeparation`,
 * `boundAutoMovieProjectionSeparation`) and the resident query
 * (`createAutoMovieMeshSeparationQuery`) refuse unrepresentable arithmetic and
 * malformed work by name instead of returning a separation a consumer could
 * accept.
 *
 * Fixture: the unit right triangle as the resident mesh.
 *
 * Scenarios:
 *
 * 1. An empty feature ("finite vertex"), target -1 ("nonnegative"), an empty
 *    projection ("nonempty finite"), a projection difference of 2 MAX_VALUE
 *    ("representable"), an enclosure past finite range ("overflowing
 *    infinity") and an overflowing face ("face differences") refuse.
 * 2. An empty resident ("nonempty finite"), index 9 and sparse indices ("vertex"),
 *    and coordinates of 1e39, finite in binary64 but not in Float32 ("finite
 *    represented resident vertices"), refuse; the same coordinates in binary64
 *    are admitted.
 * 3. A point 1 above the resident with gap 0.5 and one unit of work is certified;
 *    clearance -1 ("nonnegative finite"), budget -1 ("safe-integer"), an empty
 *    and a sparse query ("finite query") refuse.
 */
export function test_unit_engine_geometry_separation_refusals(): void {
  const p = (x: number, y: number = 0, z: number = 0): IAutoMovieVector3 => ({ x, y, z });
  const M: number = Number.MAX_VALUE;
  const mesh: IAutoMovieMesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2], normals: [], uvs: [], skin: null };
  const refused = (label: string, run: () => unknown, message: string): void =>
    TestValidator.predicate(label, throwsError(run, message));

  // 1.
  refused("empty feature", () => boundAutoMovieConvexSeparation([], [p(1)]), "finite vertex");
  refused("target -1", () => boundAutoMovieConvexSeparation([p(0)], [p(1)], -1), "nonnegative");
  refused("empty projection", () => boundAutoMovieProjectionSeparation([], [p(1)], p(1)), "nonempty finite");
  refused("projection overflow", () => boundAutoMovieProjectionSeparation([p(-M)], [p(M)], p(1)), "representable");
  refused("enclosure overflow", () => boundAutoMovieProjectionSeparation([p(0)], [p(M)], p(1)), "overflowing infinity");
  refused("face overflow", () => boundAutoMovieConvexSeparation([p(-M), p(M), p(0, 1)], [p(0)]), "face differences");

  // 2.
  refused("empty resident", () => createAutoMovieMeshSeparationQuery({ ...mesh, positions: [], indices: [] }), "nonempty finite");
  refused("index 9", () => createAutoMovieMeshSeparationQuery({ ...mesh, indices: [0, 1, 9] }), "vertex");
  refused("sparse indices", () => createAutoMovieMeshSeparationQuery({ ...mesh, indices: new Array(3) }), "vertex");
  const beyond: IAutoMovieMesh = { ...mesh, positions: mesh.positions.map((v: number): number => v * 1e39) };
  createAutoMovieMeshSeparationQuery(beyond);
  refused("beyond Float32", () => createAutoMovieMeshSeparationQuery(beyond, "float32"), "finite represented resident vertices");

  // 3.
  const query: IAutoMovieMeshSeparationQuery = createAutoMovieMeshSeparationQuery(mesh);
  TestValidator.equals("certified", query([p(0, 0, 1)], { clearance: 0.5, budget: { remaining: 1 } }).certified, true);
  refused("clearance -1", () => query([p(0, 0, 1)], { clearance: -1, budget: { remaining: 10 } }), "nonnegative finite");
  refused("budget -1", () => query([p(0, 0, 1)], { clearance: 0.5, budget: { remaining: -1 } }), "safe-integer");
  refused("empty query", () => query([], { clearance: 0.5, budget: { remaining: 10 } }), "finite query");
  refused("sparse query", () => query(new Array(3), { clearance: 0.5, budget: { remaining: 10 } }), "finite query");
}
