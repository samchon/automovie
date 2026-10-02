import { TestValidator } from "@nestia/e2e";

import { createJointPoseRow } from "../../../scripts/body-review/createJointPoseRow";

/**
 * A review joint row states only the angles that are set.
 *
 * Scenarios:
 * 1. Only flexion set: the other two angles are `null` (unchanged).
 * 2. All three set, including zero and a negative angle: each is kept as given,
 *    so zero is a stated angle and not the unchanged marker.
 * 3. Explicit `null` and an absent angle are the same row.
 */
export const test_human_body_joint_pose_row = (): void => {
  TestValidator.equals("flexion only", createJointPoseRow("leftLowerArm", { flexion: 90 }), {
    bone: "leftLowerArm",
    flexion: 90,
    abduction: null,
    twist: null,
  });
  TestValidator.equals(
    "all angles",
    createJointPoseRow("head", { flexion: 0, abduction: -12, twist: 20 }),
    { bone: "head", flexion: 0, abduction: -12, twist: 20 },
  );
  TestValidator.equals(
    "null equals absent",
    createJointPoseRow("neck", { flexion: null, abduction: null }),
    createJointPoseRow("neck", {}),
  );
};
