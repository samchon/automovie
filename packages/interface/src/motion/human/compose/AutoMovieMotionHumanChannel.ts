/**
 * A part of the body one primitive writes at a time.
 *
 * The channels partition {@link IAutoMovieMotionHumanPosture}: `root` owns
 * `root`, `yaw` and the whole-body `rotation`; `trunk` owns `pitch`, `roll` and
 * the joints of the pelvis, the spine and the shoulder girdles; `head` owns the
 * neck, the head, the jaw and the eyes; each arm owns its limb goal and the
 * joints of its upper arm, forearm and hand; each hand owns its finger joints;
 * each leg owns its limb goal and the joints of its thigh, shank, foot and
 * toes.
 */
export type AutoMovieMotionHumanChannel = (readonly [
  "root",
  "trunk",
  "head",
  "leftLeg",
  "rightLeg",
  "leftHand",
  "rightHand",
  "leftArm",
  "rightArm",
])[number];
