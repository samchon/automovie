import type { IAutoMoviePose } from "@automovie/interface";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `FamilyCaseKit.angle` reads one clinical angle of a displayed joint: flexion
 * by default, abduction or twist on request, zero when unset or omitted.
 *
 * Scenarios:
 *
 * 1. A shoulder at (30, 45, unset) reads 30, 45 and 0.
 * 2. An omitted elbow reads 0.
 */
export function test_unit_motions_executable_family_case_kit_angle(): void {
  const shown: Parameters<typeof FamilyCaseKit.angle>[0] = {
    pose: (): IAutoMoviePose => ({
      skeleton: "s",
      root: null,
      joints: [{ bone: "rightUpperArm", flexion: 30, abduction: 45, twist: null }],
    }),
  };
  TestValidator.equals(
    "each axis, and an omitted joint",
    [
      FamilyCaseKit.angle(shown, "a", 0, "rightUpperArm"),
      FamilyCaseKit.angle(shown, "a", 0, "rightUpperArm", 1),
      FamilyCaseKit.angle(shown, "a", 0, "rightUpperArm", 2),
      FamilyCaseKit.angle(shown, "a", 0, "rightLowerArm"),
    ],
    [30, 45, 0, 0],
  );
}
