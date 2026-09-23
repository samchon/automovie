import { TestValidator } from "@nestia/e2e";

import { portraitWebCapturePose } from "../../../scripts/face-review/web/logic.mjs";
import { throwsError } from "../internal/predicates";

/**
 * A reference comparison uses one declared camera for colour and hair ID.
 * Scenarios:
 * 1. A finite subject pose carries the same yaw and pitch into both passes,
 *    including zero and the admitted angular endpoints, without input mutation.
 * 2. A missing pose map or model ID and nonfinite or out-of-range angles refuse
 *    instead of silently falling back to the front camera.
 */
export const test_subject_face_web_capture_pose = (): void => {
  const poses = { face: { yaw: -29.3, pitch: 4.1 } };
  TestValidator.equals(
    "colour view",
    portraitWebCapturePose(poses, "face", false),
    { yaw: -29.3, pitch: 4.1, hairMask: false },
  );
  TestValidator.equals("ID view", portraitWebCapturePose(poses, "face", true), {
    yaw: -29.3,
    pitch: 4.1,
    hairMask: true,
  });
  TestValidator.equals("pose input unchanged", poses.face, {
    yaw: -29.3,
    pitch: 4.1,
  });
  for (const [yaw, pitch] of [
    [0, 0],
    [-180, 89.9],
    [180, -89.9],
  ])
    TestValidator.equals(
      "admitted angle boundary",
      portraitWebCapturePose({ face: { yaw, pitch } }, "face", false),
      { yaw, pitch, hairMask: false },
    );
  const missing: (Record<
    string,
    { yaw: number; pitch: number } | null
  > | null)[] = [null, {}, { face: null }, { other: { yaw: 0, pitch: 0 } }];
  for (const invalid of missing)
    TestValidator.predicate(
      "missing measured pose refuses",
      throwsError(
        () => portraitWebCapturePose(invalid, "face", false),
        "finite measured yaw and pitch",
      ),
    );
  for (const [yaw, pitch] of [
    [NaN, 0],
    [Infinity, 0],
    [0, NaN],
    [0, -Infinity],
    [180.1, 0],
    [-180.1, 0],
    [0, 90],
    [0, -90],
  ])
    TestValidator.predicate(
      "invalid camera refuses",
      throwsError(
        () => portraitWebCapturePose({ face: { yaw, pitch } }, "face", false),
        "finite measured yaw and pitch",
      ),
    );
};
