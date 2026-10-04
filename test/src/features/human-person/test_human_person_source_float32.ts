import { createHumanPersonSourceNormals } from "@automovie/human/human/build/createHumanPersonSourceNormals";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Source shading cannot admit cells the renderer collapses or reverses.
 * These planes have independently calculated positive Double oriented area;
 * Float32 rounding either merges every point or reverses their XY determinant.
 * Scenarios:
 * 1. An ordinary source triangle admits its outward unit field.
 * 2. Sub-ulp and subnormal triangles refuse a zero rendered cell.
 * 3. A near-collinear triangle refuses Float32 direction reversal.
 * 4. A valid triangle recovers without retaining a failed field.
 */
export const test_human_person_source_float32 = (): void => {
  const source = {
    generation: "float32-source-plane",
    originalVertices: 3,
    parentTriangles: [0, 1, 2],
    intersections: [],
  };
  const face = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    sourcePartition: { ...source, samples: [0, 1, 2], parents: [0] },
  };
  const body = {
    positions: [] as number[],
    indices: [] as number[],
    sourcePartition: { ...source, samples: [], parents: [] },
  };
  const evaluate = createHumanPersonSourceNormals({ face, body })!;
  const run = (positions: number[]) =>
    evaluate({ face: positions, body: [], bodyIndices: [] });
  const sourceBefore = JSON.stringify({ face, body });
  const valid = run(face.positions);
  TestValidator.predicate(
    "ordinary source field is outward",
    valid.every((value, at) => nclose(value, at % 3 === 2 ? 1 : 0, 1e-12)),
  );
  for (const points of [
    [1, 1, 0, 1 + 1e-8, 1, 0, 1, 1 + 1e-8, 0],
    [0, 0, 0, 1e-46, 0, 0, 0, 1e-46, 0],
  ])
    TestValidator.predicate(
      "Float32 collapsed cell refuses",
      throwsError(() => run(points), "Float32 cell"),
    );
  const validNear = [1, 1, 0, 1 + 2e-7, 1 + 1e-7, 0, 1 + 3e-7, 1 + 2.4e-7, 0];
  TestValidator.predicate(
    "adjacent near-collinear cell retains direction",
    run(validNear).every((value, at) =>
      nclose(value, at % 3 === 2 ? 1 : 0, 1e-12),
    ),
  );
  const tie = [1, 1, 0, 1 + 2 ** -24, 1, 0, 1, 1 + 2 ** -23, 0];
  TestValidator.predicate(
    "exact half-ulp tie collapses and refuses",
    throwsError(() => run(tie), "Float32 cell"),
  );
  const aboveTie = [...tie];
  aboveTie[3] += Number.EPSILON;
  TestValidator.predicate(
    "first double above tie survives Float32",
    run(aboveTie).every((value, at) =>
      nclose(value, at % 3 === 2 ? 1 : 0, 1e-12),
    ),
  );
  const reversed = [1, 1, 0, 1 + 2e-7, 1 + 1e-7, 0, 1 + 3e-7, 1 + 1.6e-7, 0];
  const reversedBefore = JSON.stringify(reversed);
  TestValidator.predicate(
    "Float32 reversed cell refuses",
    throwsError(() => run(reversed), "Float32 cell"),
  );
  TestValidator.predicate(
    "valid current cells recover",
    run(face.positions).every((value, at) => nclose(value, valid[at], 1e-12)),
  );
  TestValidator.equals(
    "source and failed input remain owned by caller",
    [JSON.stringify({ face, body }), JSON.stringify(reversed)],
    [sourceBefore, reversedBefore],
  );
};
