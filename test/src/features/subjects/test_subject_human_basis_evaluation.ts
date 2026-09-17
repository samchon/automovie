import { createHumanFaceBasisBuilder } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Connected endpoint evaluation retains geometric ownership across material seams.
 *
 * Scenarios:
 * 1. Positive/negative endpoints and half weights follow independent hand sums.
 * 2. A lifted square has common area-weighted normals on its two material copies.
 * 3. Attachment channels share state while absent endpoints leave a part fixed.
 * 4. Input, result, material and neutral recovery ownership remain independent.
 * 5. UV seams duplicate only coordinate identities; a shared UV vertex is reused.
 */
export const test_subject_human_basis_evaluation = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const original = structuredClone(basis),
    originalDocument = structuredClone(document);
  const build = createHumanFaceBasisBuilder(basis);
  const mesh = (model: IAutoMovieModel, index: number): IAutoMovieMesh => {
    const geometry = model.parts[index].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    return geometry.mesh;
  };
  const neutral = build(document);
  for (const [weight, expected] of [
    [1, 1.5],
    [0.5, 1.25],
    [-1, 0.75],
    [-0.5, 0.875],
    [0, 1],
  ]) {
    const model = build({ ...document, shape: { width: weight } });
    TestValidator.predicate(
      "signed endpoint interpolation",
      nclose(mesh(model, 0).positions[3], expected),
    );
    TestValidator.equals(
      "missing endpoint leaves attachment fixed",
      mesh(model, 2).positions,
      mesh(neutral, 2).positions,
    );
  }
  const lifted = build({ ...document, expression: { lift: 1 } });
  const expectedNormal = [
    -1 / Math.sqrt(6),
    -1 / Math.sqrt(6),
    2 / Math.sqrt(6),
  ];
  for (let axis = 0; axis < 3; axis++) {
    TestValidator.predicate(
      "analytic common normal",
      nclose(mesh(lifted, 0).normals![axis], expectedNormal[axis]),
    );
    TestValidator.predicate(
      "same normal across material boundary",
      nclose(mesh(lifted, 1).normals![axis], expectedNormal[axis]),
    );
  }
  TestValidator.predicate(
    "attachment shares expression",
    nclose(mesh(lifted, 2).positions[8], 0.5),
  );
  const combined = build({
    ...document,
    expression: { lift: 0.5 },
    shape: { width: 0.5 },
  });
  TestValidator.predicate(
    "joint affine position",
    nclose(mesh(combined, 0).positions[6], 1.25) &&
      nclose(mesh(combined, 0).positions[8], 0.5),
  );
  const coloured = build({
    ...document,
    materials: {
      skin: { color: { r: 0, g: 0.5, b: 1 }, roughness: 0 },
      lips: {},
    },
  });
  TestValidator.equals(
    "material identity is retained",
    coloured.materials[0].baseColor,
    { r: 0, g: 0.5, b: 1, a: 1, hex: null },
  );
  TestValidator.equals(
    "roughness endpoint",
    coloured.materials[0].roughness,
    0,
  );
  coloured.materials[0].baseColor.r = 1;
  mesh(coloured, 0).positions[0] = 99;
  basis.surfaces[0].positions[0] = 50;
  TestValidator.equals(
    "compiled basis and earlier result own data",
    build(document),
    neutral,
  );
  basis.surfaces[0].positions[0] = original.surfaces[0].positions[0];
  TestValidator.equals("input basis was not edited", basis, original);
  TestValidator.equals(
    "input document was not edited",
    document,
    originalDocument,
  );
  const shared = humanFaceBasisFixture();
  shared.basis.surfaces[0].regions = [
    {
      id: "shared",
      material: "skin",
      indices: [0, 1, 2, 0, 2, 3],
      uvs: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    },
  ];
  TestValidator.equals(
    "matching UV identities reuse four vertices",
    mesh(createHumanFaceBasisBuilder(shared.basis)(shared.document), 0)
      .positions.length,
    12,
  );
  shared.basis.surfaces[0].regions[0].uvs![6] = 0.25;
  TestValidator.equals(
    "one UV seam adds one vertex",
    mesh(createHumanFaceBasisBuilder(shared.basis)(shared.document), 0)
      .positions.length,
    15,
  );
};
