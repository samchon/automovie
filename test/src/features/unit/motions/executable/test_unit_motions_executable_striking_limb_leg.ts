import { StrikingLimb } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The four end joints a strike can carry. */
const LIMBS: StrikingLimb.End[] = ["leftHand", "rightHand", "leftFoot", "rightFoot"];

/**
 * `StrikingLimb.leg` tells a striking foot from a hand.
 *
 * Scenarios:
 *
 * 1. The feet are legs; the hands are not.
 */
export function test_unit_motions_executable_striking_limb_leg(): void {
  TestValidator.equals(
    "the feet only",
    LIMBS.map(
      (limb: StrikingLimb.End): boolean => StrikingLimb.leg(limb),
    ),
    [false, false, true, true],
  );
}
