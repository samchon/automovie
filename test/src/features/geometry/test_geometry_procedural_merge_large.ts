import { mergeAutoMovieMeshes } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Concatenation accepts the original 144,012-component member without turning
 * the buffer into a function argument list. Direct indexed triangles isolate
 * the merge contract from an unrelated 12,000-segment revolution. All source
 * corners are finite; every index addresses one of the first 48,003 vertices.
 * The final unreferenced vertex remains part of the caller-owned vertex buffer.
 *
 * Scenarios:
 * 1. Two members each carry 48,004 vertices and 216,000 triangle indices.
 * 2. Concatenation retains all components, rebases the second member by exactly
 *    48,004 vertices, and preserves its authored final zero component.
 */
export const test_geometry_procedural_merge_large = (): void => {
  const vertices = 48_004;
  const indexCount = 216_000;
  const dense: IAutoMovieMesh = {
    positions: Array.from({ length: vertices * 3 }, (_, component) =>
      component % 9 === 3 || component % 9 === 7 ? 1 : 0,
    ),
    indices: Array.from({ length: indexCount }, (_, index) =>
      index % (vertices - 1),
    ),
    normals: null,
    uvs: null,
    skin: null,
  };
  const merged = mergeAutoMovieMeshes([dense, dense]);
  TestValidator.equals(
    "two members past the spread argument limit still merge",
    {
      positions: merged.positions.length,
      indices: merged.indices!.length,
      rebased: merged.indices!.at(-1),
      lastPosition: merged.positions.at(-1),
    },
    {
      positions: 288_024,
      indices: 432_000,
      rebased: ((indexCount - 1) % (vertices - 1)) + vertices,
      lastPosition: 0,
    },
  );
};
