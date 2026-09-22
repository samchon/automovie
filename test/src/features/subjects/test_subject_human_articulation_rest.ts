import { evaluateHumanFaceRest, humanFaceBasisWeights } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceArticulationFixture } from "../internal/humanFaceArticulationFixture";
import { throwsError } from "../internal/predicates";

/**
 * The rest layer reads channel weights and corrective activations onto
 * surfaces and landmarks by endpoint name, before any joint moves.
 * Scenarios:
 * 1. Weights refuse an unknown channel, a shape weight under `expression`,
 *    a nonfinite weight and an out-of-envelope weight, and admit the rest.
 * 2. A corrective's activation is the product of its clamped drivers and
 *    it is shape-only exactly when every driver is a shape channel.
 * 3. A shape channel moves its landmark row and its surface row alike; an
 *    expression channel moves only its surface row; a landmark row with no
 *    channel weight stays put.
 * 4. A basis without landmarks evaluates an empty landmark record and the
 *    returned surfaces are fresh copies.
 */
export const test_subject_human_articulation_rest = (): void => {
  const { basis } = humanFaceArticulationFixture();
  for (const [title, shape, expression] of [
    ["unknown channel", { nope: 1 }, {}],
    ["shape weight under expression", {}, { spacing: 1 }],
    ["nonfinite weight", { spacing: NaN }, {}],
    ["weight past the envelope", {}, { open: 2 }],
  ] as const)
    TestValidator.predicate(
      title + " refuses",
      throwsError(() => humanFaceBasisWeights(basis, { shape, expression })),
    );
  basis.correctives = [
    {
      id: "pair",
      inputs: [
        { channel: "open", side: "positive" },
        { channel: "forward", side: "positive" },
      ],
      weight: 1,
      target: "pairTarget",
    },
    {
      id: "identity",
      inputs: [{ channel: "spacing", side: "positive" }],
      weight: 0.5,
      target: "identityTarget",
    },
  ];
  basis.surfaces[0].targets.pairTarget = [1, 0, 0, 1];
  basis.surfaces[0].targets.identityTarget = [1, 0, 1, 0];
  const state = humanFaceBasisWeights(basis, {
    shape: { spacing: 0.5 },
    expression: { open: 0.5, forward: 0.5 },
  });
  TestValidator.equals(
    "product activation and shape-only flag",
    state.activations.map(({ target, activation, shapeOnly }) => ({
      target,
      activation,
      shapeOnly,
    })),
    [
      { target: "pairTarget", activation: 0.25, shapeOnly: false },
      { target: "identityTarget", activation: 0.25, shapeOnly: true },
    ],
  );
  const rest = evaluateHumanFaceRest(basis, state);
  TestValidator.equals(
    "shape moves the landmark and the surface alike",
    [rest.landmarks["joint-l-eye"], rest.surfaces[0].slice(9, 12)],
    [{ x: 2.5, y: 0, z: 0 }, [0.5, 1, 0]],
  );
  TestValidator.equals(
    "corrective rows land on the surface",
    rest.surfaces[0].slice(3, 6),
    [1, 0.25, 0.25],
  );
  TestValidator.equals(
    "expression rows land on the surface only",
    [rest.surfaces[0][2], rest.landmarks["joint-mouth"]],
    [0.5 * 0.01 + 0.5 * 0.02, { x: 0, y: 0, z: 0 }],
  );
  const bare = humanFaceArticulationFixture().basis;
  delete bare.landmarks;
  delete bare.articulation;
  for (const surface of bare.surfaces) delete surface.attachments;
  const plain = evaluateHumanFaceRest(bare, {
    weights: new Map(),
    activations: [],
  });
  plain.surfaces[0][0] = 9;
  TestValidator.equals(
    "no landmarks and owned copies",
    [plain.landmarks, bare.surfaces[0].positions[0]],
    [{}, 0],
  );
};
