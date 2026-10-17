import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Simple-tube ownership and actual receiving bones of the seven regional families.
 *
 * Cuts are chosen at the neck, waist, mid limbs, wrist and ankle. Shoulder,
 * axilla and groin remain within their trunk owners. The hand owns the wrist
 * even though the arm lies earlier in the skeleton, so geometry dependencies
 * follow this graph rather than a guessed anatomical generation order.
 */
export const currentAnatomicalEdges64: C.Edge[] = [
  {
    id: "neck.midTube",
    ownerRegion: "face",
    ownerBone: "neck",
    consumerRegion: "chest-waist-shoulder",
    consumerBone: "spine",
  },
  {
    id: "waist.midTube",
    ownerRegion: "chest-waist-shoulder",
    ownerBone: "spine",
    consumerRegion: "pelvis",
    consumerBone: "hips",
  },
  ...(["left", "right"] as const).flatMap((s: string): C.Edge[] => [
    {
      id: s + ".upperArm.midTube",
      ownerRegion: "chest-waist-shoulder",
      ownerBone: s + "UpperArm",
      consumerRegion: "arms",
      consumerBone: s + "UpperArm",
    },
    {
      id: s + ".wrist.midTube",
      ownerRegion: "hands",
      ownerBone: s + "Hand",
      consumerRegion: "arms",
      consumerBone: s + "LowerArm",
    },
    {
      id: s + ".thigh.midTube",
      ownerRegion: "pelvis",
      ownerBone: s + "UpperLeg",
      consumerRegion: "legs",
      consumerBone: s + "UpperLeg",
    },
    {
      id: s + ".ankle.midTube",
      ownerRegion: "legs",
      ownerBone: s + "LowerLeg",
      consumerRegion: "feet",
      consumerBone: s + "Foot",
    },
  ]),
];
