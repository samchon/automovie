import type { IAutoMoviePose } from "@automovie/interface";
import { galleryCaseZero } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `galleryCaseZero` poses every bone of a skeleton at clinical zero, with no
 * root, except the bones given their flexion, abduction and twist.
 *
 * Scenario: on a three-bone skeleton with the left elbow flexed 90 degrees and
 * twisted 10, the pose names the skeleton, has no root, and holds the other two
 * bones at zero, in the skeleton's order.
 */
export function test_unit_motions_executable_gallery_case_zero(): void {
  const pose: IAutoMoviePose = galleryCaseZero(
    {
      skeleton: {
        id: "rig",
        bones: [{ bone: "hips" }, { bone: "leftLowerArm" }, { bone: "head" }],
      },
    },
    { leftLowerArm: [90, 0, 10] },
  );
  TestValidator.equals("the zero pose", pose, {
    skeleton: "rig",
    root: null,
    joints: [
      { bone: "hips", flexion: 0, abduction: 0, twist: 0 },
      { bone: "leftLowerArm", flexion: 90, abduction: 0, twist: 10 },
      { bone: "head", flexion: 0, abduction: 0, twist: 0 },
    ],
  });
}
