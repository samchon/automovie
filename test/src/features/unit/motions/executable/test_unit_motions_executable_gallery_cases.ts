import type { IAutoMoviePose } from "@automovie/interface";
import { galleryCaseFist, galleryCaseZero } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The scenarios of `test_unit_motions_executable_gallery_case_fist`. */
namespace ScenarioGalleryCaseFist {
  /**
   * `galleryCaseFist` flexes one hand into a fist: each finger's proximal joint
   * 85 degrees and its middle and distal 95, the thumb's proximal 40 and distal
   * 50.
   *
   * Scenarios:
   *
   * 1. The left fist sets its fourteen finger and thumb joints, and nothing of the
   *    right hand.
   */
  export function test_unit_motions_executable_gallery_case_fist(): void {
    const fist: ReturnType<typeof galleryCaseFist> = galleryCaseFist("left");
    TestValidator.equals(
      "the fist's joints",
      [
        Object.keys(fist).length,
        fist.leftIndexProximal,
        fist.leftLittleDistal,
        fist.leftMiddleIntermediate,
        fist.leftThumbProximal,
        fist.leftThumbDistal,
        fist.rightIndexProximal,
      ],
      [
        14,
        [85, 0, 0],
        [95, 0, 0],
        [95, 0, 0],
        [40, 0, 0],
        [50, 0, 0],
        undefined,
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_gallery_case_zero`. */
namespace ScenarioGalleryCaseZero {
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
}

/**
 * The `gallery_cases` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_gallery_cases(): void {
  ScenarioGalleryCaseFist.test_unit_motions_executable_gallery_case_fist();
  ScenarioGalleryCaseZero.test_unit_motions_executable_gallery_case_zero();
}
