import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import { walkHipTwist } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `walkHipTwist` reads the least hip rotation available either way at either
 * hip: the smaller of each hip's internal and external range, then the stiffer
 * hip's.
 *
 * Scenarios:
 *
 * 1. Hips of -40 to 30 and -25 to 45 degrees of twist give 25: the right hip's
 *    25 internal, under the left's 30 external.
 * 2. A hip with no twist interval is refused.
 */
export function test_unit_motions_actions_walk_hip_twist(): void {
  const rom: typeof DEFAULT_HUMANOID_ROM = {
    ...DEFAULT_HUMANOID_ROM,
    leftUpperLeg: {
      ...DEFAULT_HUMANOID_ROM.leftUpperLeg!,
      twist: { min: -40, max: 30 },
    },
    rightUpperLeg: {
      ...DEFAULT_HUMANOID_ROM.rightUpperLeg!,
      twist: { min: -25, max: 45 },
    },
  };
  TestValidator.equals("the stiffer hip's lesser way", walkHipTwist(rom), 25);
  TestValidator.error("a hip with no twist", (): number =>
    walkHipTwist({
      ...rom,
      rightUpperLeg: { ...rom.rightUpperLeg!, twist: null },
    }),
  );
}
