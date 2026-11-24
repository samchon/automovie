import { galleryCaseFist } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

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
    [14, [85, 0, 0], [95, 0, 0], [95, 0, 0], [40, 0, 0], [50, 0, 0], undefined],
  );
}
