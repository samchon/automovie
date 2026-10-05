import { createHumanBodyJointPoseRow as joint } from "@automovie/human/body/document/createHumanBodyJointPoseRow";
import { createHumanBodyShoulderPose as shoulder } from "@automovie/human/body/document/createHumanBodyShoulderPose";
import type { BodyPosePreset } from "../body/bodyPosePresets";

/**
 * The connected person editor's pose presets: rest, the arm poses the body
 * editor offers, and the head-and-neck poses the person's one skin is checked
 * against. Joint angles are clinical degrees.
 *
 * @author Samchon
 */
export const connectedPersonPosePresets: BodyPosePreset[] = [
  { name: "A-pose", pose: [] },
  {
    name: "T-pose",
    pose: [joint("leftLowerArm", 0), joint("rightLowerArm", 0)],
    shoulders: [shoulder("leftUpperArm", 0, 90), shoulder("rightUpperArm", 0, 90)],
  },
  { name: "Head turn", pose: [joint("neck", null, null, 30), joint("head", 10, null, 20)] },
  { name: "Head flexion", pose: [joint("neck", 20), joint("head", 15)] },
  { name: "Head extension", pose: [joint("neck", -20), joint("head", -15)] },
  { name: "Arms overhead", shoulders: [shoulder("leftUpperArm", 0, 180), shoulder("rightUpperArm", 0, 180)] },
  {
    name: "Sitting",
    pose: [joint("leftUpperLeg", 90), joint("rightUpperLeg", 90), joint("leftLowerLeg", 90), joint("rightLowerLeg", 90)],
  },
];
