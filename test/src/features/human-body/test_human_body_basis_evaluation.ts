import {
  type IAutoMovieHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * The shape layer follows the stated order on skin and landmarks alike.
 *
 * Scenarios:
 * 1. Signed endpoints and half weights follow independent hand sums, and a
 *    negative weight selects the authored negative endpoint.
 * 2. The corrective fires as the product of its drivers: absent on one driver,
 *    a quarter at two halves, full at two ones.
 * 3. A channel that carries landmark rows moves the joint with the skin, and
 *    identity moves the skin but not the landmarks, before the channels.
 * 4. Unsupported controls, out-of-envelope weights, a foreign basis revision
 *    and identity on an unknown surface refuse.
 * 5. Inputs, results and the compiled basis own their data independently and
 *    the same document builds the same body twice.
 */
export const test_human_body_basis_evaluation = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const original = structuredClone(basis);
  const build = createHumanBodyBasisBuilder(basis);
  const mesh = (model: IAutoMovieModel): IAutoMovieMesh => {
    const geometry = model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    return geometry.mesh;
  };
  // The region splitter emits vertices in first-occurrence order of the
  // region's triangles, so a source vertex is read back through that order.
  const order = [...new Set(basis.surfaces[0].regions[0].indices)];
  const at = (model: IAutoMovieModel, vertex: number, axis: number): number =>
    mesh(model).positions[order.indexOf(vertex) * 3 + axis];
  // Vertex 1 sits at x = +0.1 in the neutral; wide adds 0.05, narrow 0.02 back.
  for (const [weight, expected] of [
    [1, 0.15],
    [0.5, 0.125],
    [-1, 0.08],
    [-0.5, 0.09],
    [0, 0.1],
  ]) {
    const model = build({ ...document, shape: { width: weight } }).model;
    TestValidator.predicate(
      "signed endpoint interpolation " + weight,
      nclose(at(model, 1, 0), expected),
    );
  }
  const z = (shape: Record<string, number>): number =>
    at(build({ ...document, shape }).model, 6, 2);
  TestValidator.predicate(
    "corrective absent on one driver",
    nclose(z({ width: 1 }), 0.2),
  );
  TestValidator.predicate(
    "corrective absent on the other",
    nclose(z({ tall: 1 }), 0.2),
  );
  TestValidator.predicate(
    "corrective is a quarter at two halves",
    nclose(z({ width: 0.5, tall: 0.5 }), 0.2 + 0.0025),
  );
  TestValidator.predicate(
    "corrective full at two ones",
    nclose(z({ width: 1, tall: 1 }), 0.21),
  );
  TestValidator.predicate(
    "negative side does not drive a positive corrective",
    nclose(z({ width: -1, tall: 1 }), 0.2),
  );
  const raised = build({ ...document, shape: { tall: 1 } });
  TestValidator.predicate(
    "landmark follows its channel",
    nclose(raised.landmarks["joint-spine-2"].y, 2.5) &&
      nclose(raised.landmarks["joint-spine-4"].y, 1),
  );
  TestValidator.predicate(
    "skin follows the same channel",
    nclose(at(raised.model, 4, 1), 2.5),
  );
  const identified = build({
    ...document,
    identity: { box: [4, 0, 0.25, 0] },
    shape: { tall: 1 },
  });
  TestValidator.predicate(
    "identity adds before channels and leaves landmarks alone",
    nclose(at(identified.model, 4, 1), 2.75) &&
      nclose(identified.landmarks["joint-spine-2"].y, 2.5),
  );
  const refusals: [string, IAutoMovieHumanBodyBasisDocument][] = [
    ["unsupported control", { ...document, shape: { ghost: 0.1 } }],
    ["over envelope", { ...document, shape: { width: 1.5 } }],
    ["under envelope", { ...document, shape: { tall: -0.1 } }],
    ["foreign basis", { ...document, basis: "other/1" }],
    ["blank name", { ...document, name: " " }],
    [
      "identity on unknown surface",
      { ...document, identity: { ghost: [0, 1, 0, 0] } },
    ],
    [
      "identity row beyond vertices",
      { ...document, identity: { box: [8, 1, 0, 0] } },
    ],
  ];
  for (const [title, bad] of refusals) {
    let refused = false;
    try {
      build(bad);
    } catch {
      refused = true;
    }
    TestValidator.predicate("refused: " + title, refused);
  }
  const first = build(document);
  mesh(first.model).positions[0] = 99;
  first.landmarks["joint-pelvis"].x = 99;
  basis.surfaces[0].positions[0] = 50;
  const second = build(document);
  TestValidator.predicate(
    "compiled basis owns its data",
    nclose(at(second.model, 0, 0), -0.1) &&
      nclose(second.landmarks["joint-pelvis"].x, 0),
  );
  basis.surfaces[0].positions[0] = original.surfaces[0].positions[0];
  TestValidator.equals("input basis was not edited", basis, original);
  TestValidator.equals(
    "same document builds the same body",
    second,
    build(document),
  );
};
