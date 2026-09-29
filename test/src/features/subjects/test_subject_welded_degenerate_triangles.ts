import { weldedDegenerateTriangles } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/** Source weld redundancy is independent of edge incidence and face order. */
export const test_subject_welded_degenerate_triangles = (): void => {
  const mesh = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const positions = [0, 0, 0, 1e-12, 0, 0, 1, 0, 0, 0, 1, 0];
  TestValidator.equals(
    "each repeated corner pair is a source pole, independent of winding",
    weldedDegenerateTriangles(
      mesh(positions, [0, 1, 2, 2, 0, 1, 0, 2, 1, 0, 2, 3]),
    ),
    [0, 1, 2],
  );
  TestValidator.equals(
    "an implicit nonredundant face survives",
    weldedDegenerateTriangles(mesh([0, 0, 0, 1, 0, 0, 0, 1, 0], null)),
    [],
  );
  TestValidator.equals(
    "an empty face run is empty",
    weldedDegenerateTriangles(mesh([], [])),
    [],
  );
  TestValidator.predicate(
    "an incomplete triangle run is refused",
    throwsError(() => weldedDegenerateTriangles(mesh(positions, [0, 1]))),
  );
  TestValidator.predicate(
    "an out-of-range vertex is refused",
    throwsError(() => weldedDegenerateTriangles(mesh(positions, [0, 1, 4]))),
  );
  TestValidator.predicate(
    "a nonfinite source cannot establish welded redundancy",
    throwsError(() =>
      weldedDegenerateTriangles(mesh([0, 0, 0, NaN, 0, 0, 0, 1, 0], null)),
    ),
  );
};
