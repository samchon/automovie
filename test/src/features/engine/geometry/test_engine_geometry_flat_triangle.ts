import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMeshTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `emptyMeshTarget()` makes four new empty buffers, and
 * `pushFlatTriangle(target, corners)` appends a triangle owning its corners and
 * its plane normal (b - a) x (c - a) normalized.
 *
 * Scenarios:
 *
 * 1. Two targets are empty and share no array.
 * 2. Corners (0,0,0), (2,0,0), (0,2,0) with UVs (0,0), (2,0), (0,2): three
 *    vertices facing +z, indices [0, 1, 2].
 * 3. A second triangle (0,0,0), (0,0,1), (1,0,0) faces +y and indexes from 3.
 * 4. A zero-area triangle gets the zero normal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names target ownership, appended indices and UVs, plane normals and zero-area output.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public target and append operations, reading arrays after consecutive triangles and a degenerate triangle.
 * @evidence contracts/development/testing.md#independent-expectations The written edge cross products point along +z and +y. A second three-vertex addition starts at index 3. Equal-area-zero corners have no unit normal.
 */
export function test_engine_geometry_flat_triangle(): void {
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });

  // 1.
  const a: IAutoMovieMeshTarget = AutoMovieEngineGeometry.emptyMeshTarget();
  const b: IAutoMovieMeshTarget = AutoMovieEngineGeometry.emptyMeshTarget();
  TestValidator.equals("empty", a, {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
  });
  TestValidator.predicate(
    "distinct",
    a.positions !== b.positions &&
      a.normals !== b.normals &&
      a.uvs !== b.uvs &&
      a.indices !== b.indices,
  );

  // 2.
  AutoMovieEngineGeometry.pushFlatTriangle(a, [
    [p(0, 0, 0), 0, 0],
    [p(2, 0, 0), 2, 0],
    [p(0, 2, 0), 0, 2],
  ]);
  TestValidator.equals("first", a, {
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 2, 0, 0, 2],
    indices: [0, 1, 2],
  });

  // 3.
  AutoMovieEngineGeometry.pushFlatTriangle(a, [
    [p(0, 0, 0), 0, 0],
    [p(0, 0, 1), 0, 1],
    [p(1, 0, 0), 1, 0],
  ]);
  TestValidator.equals(
    "second normals",
    a.normals.slice(9),
    [0, 1, 0, 0, 1, 0, 0, 1, 0],
  );
  TestValidator.equals("second indices", a.indices, [0, 1, 2, 3, 4, 5]);

  // 4.
  AutoMovieEngineGeometry.pushFlatTriangle(b, [
    [p(0, 0, 0), 0, 0],
    [p(1, 0, 0), 1, 0],
    [p(2, 0, 0), 2, 0],
  ]);
  TestValidator.equals("zero area", b.normals, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
}
