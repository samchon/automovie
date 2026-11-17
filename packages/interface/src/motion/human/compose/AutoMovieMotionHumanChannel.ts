/**
 * A part of the body one primitive writes at a time.
 *
 * The channels partition {@link IAutoMovieMotionHumanPosture}: `root` owns `root`, `yaw`
 * and the whole-body `rotation`;
 * `trunk` owns `pitch`, `roll` and the joints of the pelvis, the spine and the
 * shoulder girdles; `head` owns the neck, the head, the jaw and the eyes;
 * each arm owns its limb goal and the joints of its upper arm, forearm and
 * hand; each hand owns its finger joints; each leg owns its limb goal and the
 * joints of its thigh, shank, foot and toes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a channel is and which fields of a posture each one owns. Contracts used by AutoMovieMotionHumanJoints.channels, composeAutoMovieMotionHumanAction.rank, composeAutoMovieMotionHumanAction.shared.
 * @evidence contracts/development/design.md#principled-representation A partition of the posture by the kinematic tree: the root, the trunk it carries, the head and the limbs that hang from the trunk, and each hand at the end of its arm. Closed choices "trunkTurn" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nine channels, the coarsest split under which two parts of one action never need the same channel at once; the only owner of which field belongs to which part. Runtime boundary references: compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.channels, return); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.channels, c); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction.rank, c); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction.shared, c); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction, c); everyday/gesture.ts (gesture.plan, c).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union read from the `ORDER` list, so a primitive cannot claim a part the merge does not know and a page lists the same channels. Shares the canonical AutoMovieHumanDigit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
