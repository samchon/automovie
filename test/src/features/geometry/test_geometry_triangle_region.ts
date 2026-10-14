import { test12ValuesClose } from "../internal/test12ValuesClose";
import { selectAutoMovieTriangleRegion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * An oriented mesh loop selects source triangles by connectivity. Projection and coordinate changes cannot change the selected population.
 *
 * Scenarios:
 * 1. A square inside a triangulated annulus selects exactly its two triangles; the outer boundary selects all ten and a reversed inner loop refuses to consume unrelated exterior free edges.
 * 2. Either oriented side of a triangular loop on a closed tetrahedron is a valid patch. A nonseparating cycle around a periodic torus is refused.
 * 3. Invalid boundaries, incomplete/degenerate triangles, inconsistent winding and nonmanifold edges are refused before a partial cut can be returned.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls oriented triangle-region selection and checks exact source ordinals or structural refusal; crossing a supplied boundary or silently consuming an exterior component fails.
 * @evidence contracts/testing.md#independent-expectations The authored annulus and tetrahedron adjacency determine the two-triangle interior and complementary closed patches; a periodic 3-by-3 torus loop is nonseparating independently of spatial projection.
 * @evidence contracts/testing.md#distinguishing-cases Inner/outer and reversed boundaries, closed complementary sides, nonseparating loops, empty/short/repeated/invalid boundaries and incomplete/degenerate/inconsistently wound/nonmanifold sources are retained; this unit does not judge anatomical or visual plausibility.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_geometry_triangle_region entry owns these synchronous portable numerical cases and any local iteration; it starts no process, browser or GPU and makes no visual-success claim.
 */
export function test_geometry_triangle_region(): void {
  const indices: number[] = [
    0, 1, 2, 0, 2, 3, 4, 5, 1, 4, 1, 0, 5, 6, 2, 5, 2, 1, 6, 7, 3, 6, 3, 2, 7,
    4, 0, 7, 0, 3,
  ];
  TestValidator.predicate("inner square population", test12ValuesClose(selectAutoMovieTriangleRegion({ indices, boundary: [0, 1, 2, 3] }), [0, 1]));
  TestValidator.predicate("complete outer population", test12ValuesClose(selectAutoMovieTriangleRegion({ indices, boundary: [4, 5, 6, 7] }), Array.from({ length: 10 }, (_v: unknown, i: number): number => i)));
  TestValidator.predicate(
    "exterior is not silently cut",
    throwsError((): number[] =>
      selectAutoMovieTriangleRegion({ indices, boundary: [3, 2, 1, 0] }),
    ),
  );
  TestValidator.predicate(
    "open boundary must follow its face winding",
    throwsError((): number[] =>
      selectAutoMovieTriangleRegion({
        indices: [0, 1, 2],
        boundary: [2, 1, 0],
      }),
    ),
  );
  const tetra: number[] = [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3];
  TestValidator.predicate("closed inward face", test12ValuesClose(selectAutoMovieTriangleRegion({ indices: tetra, boundary: [0, 2, 1] }), [0]));
  TestValidator.predicate("closed opposite patch", test12ValuesClose(selectAutoMovieTriangleRegion({ indices: tetra, boundary: [1, 2, 0] }), [1, 2, 3]));
  const torus: number[] = [];
  const vertex: (x: number, y: number) => number = (x: number, y: number): number => (y % 3) * 3 + (x % 3);
  for (let y: number = 0; y < 3; y++)
    for (let x: number = 0; x < 3; x++) {
      const a: number = vertex(x, y),
        b: number = vertex(x + 1, y),
        c: number = vertex(x + 1, y + 1),
        d: number = vertex(x, y + 1);
      torus.push(a, b, c, a, c, d);
    }
  TestValidator.predicate(
    "nonseparating boundary is refused",
    throwsError((): number[] =>
      selectAutoMovieTriangleRegion({ indices: torus, boundary: [0, 1, 2] }),
    ),
  );
  for (const boundary of [
    [],
    [0, 1],
    [0, 1, 2, 0],
    [0, 2, 4],
    [0, 1, NaN],
    [0, 1, -1],
  ])
    TestValidator.predicate(
      "invalid boundary",
      throwsError((): number[] => selectAutoMovieTriangleRegion({ indices, boundary })),
    );
  for (const broken of [
    [0, 1],
    [0, 0, 1],
    [-1, 1, 2],
    [0, 1, 2, 0, 1, 3],
    [0, 1, 2, 1, 0, 3, 0, 1, 4],
  ])
    TestValidator.predicate(
      "invalid triangle source",
      throwsError((): number[] =>
        selectAutoMovieTriangleRegion({ indices: broken, boundary: [0, 1, 2] }),
      ),
    );
}
