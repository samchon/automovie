import { createHumanFaceHairResultCache } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";

/**
 * One pose and numerical hairstyle retain one generated result while every
 * caller gets owned parts and finishes. Certification follows a successful
 * complete model gate and is lost when either dependency changes.
 */
export const test_subject_human_face_hair_result_cache = (): void => {
  let generated = 0;
  const cached = createHumanFaceHairResultCache((hair) => ({
    parts: [{ vertices: [++generated, hair.layers[0]!.lengthAxes[0]] }],
    materials: [{ color: [0.1, 0.2, 0.3] }],
  }));
  const positions = new Map<string, readonly number[]>();
  const pose = {};
  const hair = createNumericalHairFixture();
  const first = cached(hair, positions, pose);
  TestValidator.equals("first hairstyle is generated", generated, 1);
  TestValidator.equals("new result needs a model gate", first.certified, false);
  first.value.parts[0].vertices[0] = 99;
  first.value.materials[0].color[0] = 99;
  const same = cached(structuredClone(hair), positions, pose);
  TestValidator.equals("same values reuse generation", generated, 1);
  TestValidator.equals(
    "uncertified hit still needs a gate",
    same.certified,
    false,
  );
  TestValidator.equals(
    "returned cards are independent",
    same.value.parts[0].vertices,
    [1, 0.05],
  );
  TestValidator.equals(
    "returned finish is independent",
    same.value.materials[0].color,
    [0.1, 0.2, 0.3],
  );
  TestValidator.predicate("copies are distinct", first.value !== same.value);
  same.certify();
  TestValidator.equals(
    "successful gate certifies a hit",
    cached(hair, positions, pose).certified,
    true,
  );
  const changedHair = structuredClone(hair);
  changedHair.layers[0]!.lengthAxes[0] = 0.06;
  const longer = cached(changedHair, positions, pose);
  TestValidator.equals(
    "hair field change rebuilds",
    longer.value.parts[0].vertices,
    [2, 0.06],
  );
  TestValidator.equals(
    "hair change resets certification",
    longer.certified,
    false,
  );
  const moved = cached(changedHair, positions, {});
  TestValidator.equals(
    "new face pose rebuilds",
    moved.value.parts[0].vertices,
    [3, 0.06],
  );
  TestValidator.equals(
    "pose change resets certification",
    moved.certified,
    false,
  );
};
