import { TestValidator } from "@nestia/e2e";

import { portraitWebCapturePose } from "../../../scripts/face-review/web/logic.mjs";
import { throwsError } from "../internal/predicates";

/**
 * A reference comparison uses one declared camera for colour and hair ID.
 * Scenarios:
 * 1. A finite subject pose carries the same yaw and pitch into both passes,
 *    including zero and the admitted angular endpoints, without input mutation.
 *    A pose's vertical field of view travels with it; a field outside
 *    (0, 180) degrees refuses.
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
  const framed = {
    face: {
      yaw: -26,
      pitch: 0,
      distance: 1.55,
      target: [0, -0.19, 0.06] as [number, number, number],
    },
  };
  const options = portraitWebCapturePose(framed, "face", true);
  TestValidator.equals("fixed full-hair framing", options, {
    yaw: -26,
    pitch: 0,
    hairMask: true,
    distance: 1.55,
    target: [0, -0.19, 0.06],
  });
  options.target![1] = 0;
  TestValidator.equals(
    "a portrait lens travels with the pose",
    portraitWebCapturePose(
      { face: { yaw: 3, pitch: 0, distance: 2, fov: 8.8 } },
      "face",
      false,
    ),
    { yaw: 3, pitch: 0, hairMask: false, distance: 2, fov: 8.8 },
  );
  TestValidator.equals(
    "frame stays caller-owned",
    framed.face.target,
    [0, -0.19, 0.06],
  );
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
        "finite measured camera pose and frame",
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
        "finite measured camera pose and frame",
      ),
    );
  for (const extra of [
    { distance: 0 },
    { distance: -1 },
    { distance: NaN },
    { target: [0, 0] },
    { target: [0, Infinity, 0] },
    { fov: 0 },
    { fov: 180 },
    { fov: NaN },
  ])
    TestValidator.predicate(
      "invalid full-hair frame refuses",
      throwsError(
        () =>
          portraitWebCapturePose(
            { face: { yaw: 0, pitch: 0, ...extra } } as unknown as Record<
              string,
              { yaw: number; pitch: number }
            >,
            "face",
            false,
          ),
        "finite measured camera pose and frame",
      ),
    );
};
