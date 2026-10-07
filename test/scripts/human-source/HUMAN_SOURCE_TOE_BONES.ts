import type { AutoMovieHumanBodyToeBone } from "@automovie/human/body/structures/rig/AutoMovieHumanBodyToeBone";

/**
 * The MPFB default rig's toe phalanx bones (`rig.default.json`, CC0) and the
 * product toe bone each one becomes, left side; the right side swaps `.L` for
 * `.R` and `left` for `right`. The hallux has two phalanges (toe1-1, toe1-2),
 * the lesser toes three (toeN-1 to toeN-3), listed proximal first so a parent
 * always precedes its child.
 */
export const HUMAN_SOURCE_TOE_BONES: readonly [
  string,
  AutoMovieHumanBodyToeBone,
][] = [
  ["toe1-1", "leftHalluxProximal"],
  ["toe1-2", "leftHalluxDistal"],
  ["toe2-1", "leftSecondToeProximal"],
  ["toe2-2", "leftSecondToeMiddle"],
  ["toe2-3", "leftSecondToeDistal"],
  ["toe3-1", "leftThirdToeProximal"],
  ["toe3-2", "leftThirdToeMiddle"],
  ["toe3-3", "leftThirdToeDistal"],
  ["toe4-1", "leftFourthToeProximal"],
  ["toe4-2", "leftFourthToeMiddle"],
  ["toe4-3", "leftFourthToeDistal"],
  ["toe5-1", "leftFifthToeProximal"],
  ["toe5-2", "leftFifthToeMiddle"],
  ["toe5-3", "leftFifthToeDistal"],
];
