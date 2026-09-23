import { createHumanFaceHairRoots } from "@automovie/human/face/anatomy/hair/createHumanFaceHairRoots";
import { humanFaceHairSequence } from "@automovie/human/face/anatomy/hair/humanFaceHairSequence";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Area roots retain neutral attachments and stable sequence identities.
 * Scenarios:
 * 1. Analytic radical inverses and unit-L1 triangle seats have hand-known sums.
 * 2. Zero population is empty; increasing count preserves the complete prefix.
 * 3. A tighter polar mask retains the same seats for common sequence identities.
 * 4. Compiled arrays are owned; empty/zero-area domains refuse before sampling.
 */
export const test_subject_human_numerical_hair_roots = (): void => {
  for (const [index, base, value] of [
    [0, 2, 0],
    [1, 2, 0.5],
    [2, 2, 0.25],
    [3, 2, 0.75],
    [5, 3, 7 / 9],
  ])
    TestValidator.predicate(
      "radical inverse",
      nclose(humanFaceHairSequence(index, base), value),
    );
  const mesh = createSignedOctahedron();
  const sample = createHumanFaceHairRoots({
    positions: mesh.positions,
    indices: mesh.indices!,
    triangles: [0, 1, 2, 3, 4, 5, 6, 7],
    origin: [0, 0, 0],
  });
  const layer = createNumericalHairFixture().layers[0];
  TestValidator.equals(
    "empty population",
    sample({ ...layer, count: 0 }).roots,
    [],
  );
  const roots = sample({ ...layer, count: 64 }).roots;
  TestValidator.equals("stable prefix", sample(layer).roots, roots.slice(0, 2));
  for (const root of roots) {
    TestValidator.predicate(
      "barycentric partition",
      nclose(
        root.weights.reduce((a, b) => a + b, 0),
        1,
      ),
    );
    TestValidator.predicate(
      "point on L1 ball",
      nclose(
        Math.abs(root.point.x) +
          Math.abs(root.point.y) +
          Math.abs(root.point.z),
        1,
      ),
    );
  }
  const masked = sample({
    ...layer,
    count: 16,
    hairline: {
      front: Math.PI / 2,
      left: Math.PI / 2,
      right: Math.PI / 2,
      back: Math.PI / 2,
    },
  }).roots;
  for (const root of masked) {
    TestValidator.predicate("upper hemisphere", root.point.y >= 0);
    const original = roots.find((item) => item.sequence === root.sequence);
    TestValidator.predicate(
      "retained sequence present",
      original !== undefined,
    );
    TestValidator.equals("retained root unchanged", root, original!);
  }
  mesh.positions.fill(999);
  mesh.indices!.fill(0);
  TestValidator.equals(
    "compiled source owned",
    sample({ ...layer, count: 64 }).roots,
    roots,
  );
  for (const triangles of [[], [0]])
    TestValidator.predicate(
      "zero measure domain refuses",
      throwsError(() =>
        createHumanFaceHairRoots({
          positions: [0, 0, 0],
          indices: [0, 0, 0],
          triangles,
          origin: [0, 0, 0],
        }),
      ),
    );
};
