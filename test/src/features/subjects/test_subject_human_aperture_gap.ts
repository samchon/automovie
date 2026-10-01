import { measureHumanFaceApertureGap } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Preliminary closure and final-contact reports share one signed projection.
 *
 * Scenarios:
 * 1. A pair one metre apart vertically reads +1, reversed -1 and coincident 0.
 * 2. Equal translation cancels, while a transverse opening direction reads
 *    the corresponding horizontal separation instead of world height.
 */
export const test_subject_human_aperture_gap = (): void => {
  const upper = { x: 2, y: 1, z: 0 };
  const lower = { x: 0, y: 0, z: 0 };
  const up = { x: 0, y: 1, z: 0 };
  TestValidator.predicate("opening has a positive gap", nclose(measureHumanFaceApertureGap(upper, lower, up), 1));
  TestValidator.predicate("reversed ordering has a negative gap", nclose(measureHumanFaceApertureGap(lower, upper, up), -1));
  TestValidator.predicate("coincident pair is sealed", nclose(measureHumanFaceApertureGap(upper, upper, up), 0));
  TestValidator.predicate(
    "shared translation cancels",
    nclose(measureHumanFaceApertureGap({ x: 12, y: 21, z: 30 }, { x: 10, y: 20, z: 30 }, up), 1),
  );
  TestValidator.predicate("the declared axis is used", nclose(measureHumanFaceApertureGap(upper, lower, { x: 1, y: 0, z: 0 }), 2));
};
