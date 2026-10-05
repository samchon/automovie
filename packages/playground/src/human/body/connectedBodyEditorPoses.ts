import type { BodyPosePreset } from "./bodyPosePresets";
import { createHumanBodyJointPoseRow as joint } from "@automovie/human/body/document/createHumanBodyJointPoseRow";
import { createHumanBodyShoulderPose as shoulder } from "@automovie/human/body/document/createHumanBodyShoulderPose";

/**
 * The body editor's pose presets, in button order. Angles are clinical
 * degrees; "Arms down" is solved on the current body, each arm hanging as low
 * as its skin lets it.
 *
 * @author Samchon
 */
export const connectedBodyEditorPoses: readonly BodyPosePreset[] = [
  { name: "A-pose", pose: [] },
  {
    name: "T-pose",
    pose: [joint("leftLowerArm", 0), joint("rightLowerArm", 0)],
    shoulders: [shoulder("leftUpperArm", 0, 90), shoulder("rightUpperArm", 0, 90)],
  },
  { name: "Arms down", solve: "armsDown" },
  { name: "Elbows 90", pose: [joint("leftLowerArm", 90), joint("rightLowerArm", 90)] },
  { name: "Arms overhead", shoulders: [shoulder("leftUpperArm", 0, 180), shoulder("rightUpperArm", 0, 180)] },
  {
    name: "Squat",
    pose: [
      joint("leftUpperLeg", 90),
      joint("rightUpperLeg", 90),
      joint("leftLowerLeg", 120),
      joint("rightLowerLeg", 120),
      joint("leftFoot", 20),
      joint("rightFoot", 20),
    ],
  },
  {
    name: "Sitting",
    pose: [joint("leftUpperLeg", 90), joint("rightUpperLeg", 90), joint("leftLowerLeg", 90), joint("rightLowerLeg", 90)],
  },
  {
    name: "Trunk twist",
    pose: [joint("spine", null, null, 10), joint("chest", null, null, 10), joint("upperChest", null, null, 10)],
  },
];
