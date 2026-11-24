import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { StrikingVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingVerdicts.classify` sorts the bone a strike met into a class: the
 * head, neck, jaw and eyes are the head; the hips, spine and chests the trunk;
 * the thigh, shank, foot and toes the leg; anything else the guard.
 *
 * Scenarios:
 *
 * 1. One bone of each class, the guard's an arm, a shoulder and a finger.
 */
export function test_unit_motions_executable_striking_verdicts_classify(): void {
  const bones: AutoMovieHumanoidBone[] = [
    "head",
    "leftEye",
    "upperChest",
    "hips",
    "rightLowerLeg",
    "leftToes",
    "rightLowerArm",
    "leftShoulder",
    "rightIndexProximal",
  ];
  TestValidator.equals(
    "each bone's class",
    bones.map(
      (bone: AutoMovieHumanoidBone): StrikingVerdicts.Class =>
        StrikingVerdicts.classify(bone),
    ),
    ["head", "head", "trunk", "trunk", "leg", "leg", "guard", "guard", "guard"],
  );
}
