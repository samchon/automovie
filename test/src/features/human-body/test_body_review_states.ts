import { TestValidator } from "@nestia/e2e";

import { standardBodyReviewStates } from "../../../scripts/body-review/standardBodyReviewDocuments";

/**
 * The standard review states are well-formed probes of the shape and joint
 * space: macro channels inside their signed range, finite clinical angles,
 * and no joint named twice in one pose.
 *
 * Scenarios:
 * 1. The set is nonempty and includes the neutral state with no shape and no
 *    pose, and each state name is used once (an object cannot repeat a key,
 *    so the count of names equals the count of states).
 * 2. Every shape value is finite and within [-1, 1].
 * 3. Every pose angle is finite or null, and no pose names a bone twice.
 * 4. Each call returns fresh objects, so a caller editing one state cannot
 *    change the next call's.
 */
export const test_body_review_states = (): void => {
  const states = standardBodyReviewStates();
  const names = Object.keys(states);
  TestValidator.predicate("nonempty", names.length >= 10);
  TestValidator.equals("neutral", states.neutral, { shape: {}, pose: [] });
  for (const name of names) {
    const { shape, pose } = states[name];
    TestValidator.predicate(
      `${name} shape in range`,
      Object.values(shape).every(
        (value) => Number.isFinite(value) && value >= -1 && value <= 1,
      ),
    );
    const bones = pose.map((entry) => entry.bone);
    TestValidator.equals(`${name} names a bone once`, new Set(bones).size, bones.length);
    TestValidator.predicate(
      `${name} angles`,
      pose.every((entry) =>
        [entry.flexion, entry.abduction, entry.twist].every(
          (angle) => angle === null || Number.isFinite(angle),
        ),
      ),
    );
  }
  states.neutral.shape.macroGender = 1;
  TestValidator.equals(
    "fresh objects per call",
    standardBodyReviewStates().neutral.shape,
    {},
  );
};
