import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Rigid performance follows the edited identity, including shape correctives.
 * Scenarios:
 * 1. A fitted square keeps its edge lengths at signed shape and fractional expression.
 * 2. A fixed attachment retains its exact rest geometry; ungrouped behavior still deforms.
 * 3. A shape-only corrective participates in rest shape; mixed performance does not.
 * 4. Neutral replay, caller mutation and output mutation retain owned results.
 */
export const test_subject_human_basis_rigid_groups = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const plain = createHumanFaceBasisBuilder(basis);
  basis.surfaces[0].rigidGroups = [
    { id: "arch", vertices: [0, 1, 2, 3], motion: "fit" },
  ];
  basis.surfaces[1].rigidGroups = [
    { id: "skull", vertices: [0, 1, 2], motion: "fixed" },
  ];
  basis.surfaces[0].targets.extraShape = [1, 0.2, 0, 0, 2, 0.2, 0, 0];
  basis.surfaces[0].targets.poseShape = [2, 0, 0, 0.3];
  basis.correctives = [
    {
      id: "shape",
      inputs: [{ channel: "width", side: "positive" }],
      weight: 1,
      target: "extraShape",
    },
    {
      id: "pose",
      inputs: [
        { channel: "width", side: "positive" },
        { channel: "lift", side: "positive" },
      ],
      weight: 1,
      target: "poseShape",
    },
  ];
  const build = createHumanFaceBasisBuilder(basis);
  const positions = (model: ReturnType<typeof build>, index: number) => {
    const geometry = model.parts[index].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected a resident mesh.");
    return geometry.mesh.positions;
  };
  const edge = (p: number[], a: number, b: number) =>
    Math.hypot(...[0, 1, 2].map((k) => p[3 * a + k] - p[3 * b + k]));
  for (const width of [-1, 0, 0.5, 1]) {
    const rest = build({ ...document, shape: { width } });
    const expectedWidth = width < 0 ? 1 + 0.25 * width : 1 + 0.7 * width;
    TestValidator.predicate(
      "rest includes signed shape and shape-only corrective",
      nclose(edge(positions(rest, 0), 0, 1), expectedWidth),
    );
    for (const lift of [0, 0.5, 1]) {
      const posed = build({
        ...document,
        shape: { width },
        expression: { lift },
      });
      const p = positions(posed, 0);
      TestValidator.predicate(
        "shape width survives expression",
        nclose(edge(p, 0, 1), expectedWidth),
      );
      TestValidator.predicate(
        "height survives expression",
        nclose(edge(p, 1, 2), 1),
      );
      TestValidator.equals(
        "fixed component",
        positions(posed, 2),
        positions(rest, 2),
      );
    }
  }
  const normal = build(document);
  TestValidator.equals("neutral remains exact", normal, plain(document));
  TestValidator.predicate(
    "ungrouped target actually stretches",
    edge(positions(plain({ ...document, expression: { lift: 1 } }), 0), 1, 2) >
      1.4,
  );
  basis.surfaces[0].rigidGroups[0].vertices.length = 0;
  positions(normal, 0).fill(9);
  TestValidator.equals(
    "basis and output isolation",
    build(document),
    plain(document),
  );
};
