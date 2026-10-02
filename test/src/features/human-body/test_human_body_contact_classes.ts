import { TestValidator } from "@nestia/e2e";

import { bodyContactBudget } from "../../../scripts/body-basis/bodyContactBudget";
import type { BodyContactBones } from "../../../scripts/body-basis/bodyContactPlanes";
import {
  isBodyLimbContact,
  isBoneThroughSkin,
} from "../../../scripts/body-basis/classifyBodyContact";

/**
 * The tissue budget of each kind of contact pair, the limb-contact test and
 * the bone-through-skin test.
 *
 * The budget figures are the solver's conventions documented on
 * `bodyContactBudget`; each scenario names the fold a figure belongs to.
 *
 * Scenarios:
 * 1. Digits get 8 mm and toes 10 mm, whichever side of the pair they are on.
 * 2. The root folds get 50 mm: the upper arm against the chest or a girdle,
 *    a root segment against itself, a thigh against the trunk, the knee fold
 *    of the same leg; the knee of two different legs, an arm against the
 *    trunk, a leg against the other leg and an arm against an arm get 25 mm;
 *    the trunk against itself gets 50 mm; an unrelated pair (a head against
 *    a hand) gets 15 mm.
 * 3. A forearm, hand or shank against the trunk or the other side is limb
 *    contact; the same limb chain (forearm against its own upper arm, shank
 *    against its own thigh) is not; two trunk segments are not.
 * 4. A bone whose segment runs through a triangle pierces it; the negative
 *    twin, the triangle moved aside, does not; a bone lying in the
 *    triangle's plane (parallel) does not; a bone that ends before the
 *    triangle does not; a bone with no frame pierces nothing.
 */
export const test_human_body_contact_classes = (): void => {
  // 1. digits and toes
  TestValidator.equals("a digit", bodyContactBudget("leftIndexProximal", "leftHand"), 0.008);
  TestValidator.equals("a digit on the other side of the pair", bodyContactBudget("chest", "rightThumbDistal"), 0.008);
  TestValidator.equals("toes", bodyContactBudget("leftFoot", "leftToes"), 0.01);
  TestValidator.equals("toes on the other side of the pair", bodyContactBudget("rightToes", "hips"), 0.01);

  // 2. folds
  for (const [a, b, budget] of [
    ["leftUpperArm", "chest", 0.05],
    ["rightShoulder", "leftUpperArm", 0.05],
    ["leftUpperArm", "leftUpperArm", 0.05],
    ["spine", "spine", 0.05],
    ["leftUpperLeg", "spine", 0.05],
    ["hips", "rightUpperLeg", 0.05],
    ["leftUpperLeg", "leftLowerLeg", 0.05],
    ["rightLowerLeg", "rightUpperLeg", 0.05],
    ["leftUpperLeg", "rightLowerLeg", 0.025],
    ["leftLowerLeg", "rightUpperLeg", 0.025],
    ["leftLowerArm", "chest", 0.025],
    ["hips", "rightLowerArm", 0.025],
    ["leftUpperLeg", "rightUpperLeg", 0.025],
    ["leftLowerArm", "rightUpperArm", 0.025],
    ["chest", "hips", 0.05],
    ["head", "leftHand", 0.015],
  ] as [string, string, number][])
    TestValidator.equals(`${a} against ${b}`, bodyContactBudget(a, b), budget);

  // 3. limb contact
  TestValidator.equals("a forearm against the trunk", isBodyLimbContact("leftLowerArm", "spine"), true);
  TestValidator.equals("a shank against the other thigh", isBodyLimbContact("leftLowerLeg", "rightUpperLeg"), true);
  TestValidator.equals("a hand against the trunk on the trunk's side of the pair", isBodyLimbContact("hips", "rightHand"), true);
  TestValidator.equals("a forearm against its own upper arm", isBodyLimbContact("leftLowerArm", "leftUpperArm"), false);
  TestValidator.equals("a shank against its own thigh", isBodyLimbContact("rightLowerLeg", "rightUpperLeg"), false);
  TestValidator.equals("two trunk segments", isBodyLimbContact("chest", "spine"), false);

  // 4. bone through skin
  const bones: BodyContactBones = new Map([
    [
      "leftLowerArm",
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        length: 1,
        parent: null,
      },
    ],
  ]);
  // the bone runs up the Y axis from the origin; a triangle in the plane
  // y = 0.5 whose interior contains x = 0 is pierced
  const flat = [
    -1, 0.5, -1,
    1, 0.5, -1,
    0, 0.5, 1,
  ];
  TestValidator.equals("the bone pierces the triangle", isBoneThroughSkin(bones, "leftLowerArm", flat, [0, 1, 2]), true);
  const aside = flat.map((value, at) => (at % 3 === 0 ? value + 5 : value));
  TestValidator.equals("a triangle moved aside is missed", isBoneThroughSkin(bones, "leftLowerArm", aside, [0, 1, 2]), false);
  const beyond = flat.map((value, at) => (at % 3 === 1 ? value + 2 : value));
  TestValidator.equals("a triangle beyond the bone's end is missed", isBoneThroughSkin(bones, "leftLowerArm", beyond, [0, 1, 2]), false);
  const along = [
    0, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ];
  TestValidator.equals("a triangle containing the bone's line is parallel and missed", isBoneThroughSkin(bones, "leftLowerArm", along, [0, 1, 2]), false);
  const sideways = [
    -1, 0.5, -0.9,
    -0.2, 0.5, -0.9,
    -0.6, 0.5, 1,
  ];
  TestValidator.equals("a triangle beside the bone's line is missed", isBoneThroughSkin(bones, "leftLowerArm", sideways, [0, 1, 2]), false);
  const wide = [
    -1, 0.5, 0.3,
    1, 0.5, 0.3,
    1, 0.5, 5,
  ];
  TestValidator.equals("a triangle whose interior misses the bone's line is missed", isBoneThroughSkin(bones, "leftLowerArm", wide, [0, 1, 2]), false);
  const hypotenuse = [
    0.6, 0.5, 0.6,
    -0.4, 0.5, 0.6,
    0.6, 0.5, -0.4,
  ];
  TestValidator.equals("a triangle whose hypotenuse passes before the bone is missed", isBoneThroughSkin(bones, "leftLowerArm", hypotenuse, [0, 1, 2]), false);
  TestValidator.equals("a bone without a frame pierces nothing", isBoneThroughSkin(bones, "rightLowerArm", flat, [0, 1, 2]), false);
  TestValidator.equals("an empty skin is missed", isBoneThroughSkin(bones, "leftLowerArm", flat, []), false);
};
