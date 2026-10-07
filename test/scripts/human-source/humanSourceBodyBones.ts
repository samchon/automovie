/**
 * VRM humanoid slot -> MPFB `game_engine` bone, the one hand-written
 * correspondence of the deleted body extraction
 * (`44dec918c:test/scripts/body-review/body_extraction/rig.py`, `BONES`).
 * It is a naming convention between two rigs, not an anatomical measurement;
 * eyes and jaw belong to the face and are absent.
 */
export const humanSourceBodyBones: Readonly<Record<string, string>> = (() => {
  const bones: Record<string, string> = {
    hips: "pelvis",
    spine: "spine_01",
    chest: "spine_02",
    upperChest: "spine_03",
    neck: "neck_01",
    head: "head",
  };
  for (const [side, suffix] of [
    ["left", "_l"],
    ["right", "_r"],
  ] as const) {
    bones[`${side}Shoulder`] = "clavicle" + suffix;
    bones[`${side}UpperArm`] = "upperarm" + suffix;
    bones[`${side}LowerArm`] = "lowerarm" + suffix;
    bones[`${side}Hand`] = "hand" + suffix;
    bones[`${side}UpperLeg`] = "thigh" + suffix;
    bones[`${side}LowerLeg`] = "calf" + suffix;
    bones[`${side}Foot`] = "foot" + suffix;
    bones[`${side}Toes`] = "ball" + suffix;
    bones[`${side}ThumbMetacarpal`] = "thumb_01" + suffix;
    bones[`${side}ThumbProximal`] = "thumb_02" + suffix;
    bones[`${side}ThumbDistal`] = "thumb_03" + suffix;
    for (const [finger, mpfb] of [
      ["Index", "index"],
      ["Middle", "middle"],
      ["Ring", "ring"],
      ["Little", "pinky"],
    ] as const) {
      bones[`${side}${finger}Proximal`] = `${mpfb}_01${suffix}`;
      bones[`${side}${finger}Intermediate`] = `${mpfb}_02${suffix}`;
      bones[`${side}${finger}Distal`] = `${mpfb}_03${suffix}`;
    }
  }
  return bones;
})();
