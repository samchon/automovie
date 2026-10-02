import { evaluateHumanBodyLandmarks } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { vclose } from "../internal/predicates";

/**
 * The landmarks a document's channels and correctives leave, without shaping
 * any skin, are the basis landmarks plus the same row sum the skin wears.
 *
 * Scenarios:
 * 1. A channel at its full weight lifts the landmark its row names by its
 *    endpoint offset and leaves every other landmark where the basis has it.
 * 2. A corrective activation scales its target rows into the landmarks.
 * 3. The result is a fresh record keyed by landmark id: writing to it changes
 *    neither the basis positions nor a second evaluation.
 */
export const test_human_body_landmarks_evaluate = (): void => {
  const { basis } = humanBodyShoulderFixture();
  const before = structuredClone(basis.landmarks);
  const rest = evaluateHumanBodyLandmarks(basis, {
    weights: new Map(),
    activations: [],
  });
  TestValidator.equals(
    "the landmark ids are the keys",
    Object.keys(rest),
    basis.landmarks.ids,
  );
  TestValidator.predicate(
    "no weight leaves the declared landmarks",
    vclose(rest["left-elbow"], { x: 0.4, y: 2.8, z: 0 }) &&
      vclose(rest["joint-spine-2"], { x: 0, y: 2, z: 0 }),
  );
  const tall = evaluateHumanBodyLandmarks(basis, {
    weights: new Map([["tall", 1]]),
    activations: [],
  });
  TestValidator.predicate(
    "a channel lifts only the landmark its row names",
    vclose(tall["joint-spine-2"], { x: 0, y: 2.5, z: 0 }) &&
      vclose(tall["left-elbow"], rest["left-elbow"]) &&
      vclose(tall["right-shoulder"], rest["right-shoulder"]),
  );
  const activated = evaluateHumanBodyLandmarks(basis, {
    weights: new Map(),
    activations: [{ target: "raised", activation: 0.5 }],
  });
  TestValidator.predicate(
    "a corrective activation scales its landmark rows",
    vclose(activated["joint-spine-2"], { x: 0, y: 2.25, z: 0 }),
  );
  rest["left-elbow"].x = 99;
  TestValidator.equals(
    "the basis landmarks are not mutated",
    basis.landmarks,
    before,
  );
  TestValidator.predicate(
    "a second evaluation is independent of the first record",
    vclose(
      evaluateHumanBodyLandmarks(basis, {
        weights: new Map(),
        activations: [],
      })["left-elbow"],
      { x: 0.4, y: 2.8, z: 0 },
    ),
  );
};
