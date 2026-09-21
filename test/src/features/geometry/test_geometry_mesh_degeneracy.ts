import {
  degenerateAutoMovieTriangles,
  inspectAutoMovieMeshTopology,
} from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A redundant face is one whose corners weld together, and there is one
 * definition of it: the standalone measurement and the topology report must
 * name the same triangles, and the weld must read positions the way a welded
 * key does.
 *
 * Scenarios:
 * 1. A face with three distinct corners is not degenerate; a face whose two
 *    corners coincide is, and the report's `degenerateTriangles` agrees.
 * 2. Corners a picosecond of a metre apart weld into one; corners a
 *    micrometre apart do not.
 * 3. A corner at -0 welds with a corner at 0, and two NaN corners weld with
 *    each other, exactly as their key strings would compare.
 * 4. Indexed and unindexed spellings of the same faces report the same
 *    triangle numbers, and the input arrays are untouched.
 * 5. Malformed indices are refused before any face is read.
 */
export const test_geometry_mesh_degeneracy = (): void => {
  const meshOf = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    normals: null,
    uvs: null,
    skin: null,
    indices,
  });
  const agree = (title: string, mesh: IAutoMovieMesh): number[] => {
    const direct = degenerateAutoMovieTriangles(mesh);
    TestValidator.equals(
      `${title}: the report names the same triangles`,
      inspectAutoMovieMeshTopology(mesh).degenerateTriangles,
      direct,
    );
    return direct;
  };

  // 1.
  TestValidator.equals(
    "distinct corners carry surface",
    agree("distinct", meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], null)),
    [],
  );
  TestValidator.equals(
    "coincident corners are redundant",
    agree(
      "coincident",
      meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 2, 0, 0, 3, 1, 0], null),
    ),
    [1],
  );

  // 2.
  TestValidator.equals(
    "a picosecond apart welds",
    agree("picosecond", meshOf([0, 0, 0, 1e-12, 0, 0, 0, 1, 0], null)),
    [0],
  );
  TestValidator.equals(
    "a micrometre apart stays distinct",
    agree("micrometre", meshOf([0, 0, 0, 1e-6, 0, 0, 0, 1, 0], null)),
    [],
  );

  // 3.
  TestValidator.equals(
    "-0 welds with 0",
    agree("signed zero", meshOf([-0, 0, 0, 0, -0, 0, 0, 1, 0], null)),
    [0],
  );
  TestValidator.equals(
    "NaN corners weld with each other",
    agree("nan", meshOf([NaN, 0, 0, NaN, 0, 0, 0, 1, 0], null)),
    [0],
  );
  TestValidator.equals(
    "a NaN corner does not weld with a finite one",
    agree("nan-finite", meshOf([NaN, 0, 0, 0, 0, 0, 0, 1, 0], null)),
    [],
  );

  // 4.
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0];
  const indices = [0, 1, 2, 1, 1, 3, 2, 3, 0];
  const before = { positions: [...positions], indices: [...indices] };
  TestValidator.equals(
    "indexed faces report by triangle number",
    agree("indexed", meshOf(positions, indices)),
    [1],
  );
  TestValidator.equals("inputs are untouched", { positions, indices }, before);

  // 5.
  TestValidator.error("an index past the last vertex is refused", () =>
    degenerateAutoMovieTriangles(
      meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 3]),
    ),
  );
  TestValidator.error("indices not in threes are refused", () =>
    degenerateAutoMovieTriangles(meshOf([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1])),
  );
};
