import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { StrikingLimb } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The four end joints a strike can carry. */
const LIMBS: StrikingLimb.End[] = [
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

/**
 * `StrikingLimb.root` names the joint a striking limb hangs from: the upper arm
 * at the shoulder, or the upper leg at the hip, on the limb's side.
 *
 * Scenarios:
 *
 * 1. Each hand hangs from its upper arm, each foot from its upper leg.
 */
export function test_unit_motions_executable_striking_limb_root(): void {
  TestValidator.equals(
    "each limb's root",
    LIMBS.map(
      (limb: StrikingLimb.End): AutoMovieHumanoidBone =>
        StrikingLimb.root(limb),
    ),
    ["leftUpperArm", "rightUpperArm", "leftUpperLeg", "rightUpperLeg"],
  );
}
