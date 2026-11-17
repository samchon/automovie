import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what a channel is and which fields of a posture each one owns.
 * @evidence contracts/development/design.md#principled-representation A partition of the posture by the kinematic tree: the root, the trunk it carries, the head and the limbs that hang from the trunk, and each hand at the end of its arm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nine channels, the coarsest split under which two parts of one action never need the same channel at once; the only owner of which field belongs to which part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union read from the `ORDER` list, so a primitive cannot claim a part the merge does not know and a page lists the same channels.
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

/**
 * Contracts used by AutoMovieMotionHumanJoints.channels, composeAutoMovieMotionHumanAction.rank, composeAutoMovieMotionHumanAction.shared.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Contracts used by AutoMovieMotionHumanJoints.channels, composeAutoMovieMotionHumanAction.rank, composeAutoMovieMotionHumanAction.shared.
 * @evidence contracts/development/design.md#principled-representation Closed choices "trunkTurn" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.channels, return); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.channels, c); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction.rank, c); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction.shared, c); compose/composeAutoMovieMotionHumanAction.ts (composeAutoMovieMotionHumanAction, c); everyday/gesture.ts (gesture.plan, c).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanPosture.Digit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace AutoMovieMotionHumanChannel {
  /**
   * What a plan claims or a carrier yields: a channel, one digit of a hand,
   * or `trunkTurn`, the spine and the chest turned about the pelvis held on
   * its support (#3491): a carrier that keeps the trunk on a saddle or a
   * moving floor yields its turn to an act that aims from it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three claim forms and the supported trunk turn above a held pelvis.
   * @evidence contracts/development/design.md#principled-representation A closed union of posture ownership units; channel and digit membership are type-checked, while composition checks overlapping claims.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends channel ownership only with the digit and trunk-turn claims current overlays use.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the channel and digit owners; trunkTurn owns the TURN bones rather than an alternate posture representation.
   */
  export type Claim =
    | AutoMovieMotionHumanChannel
    | IAutoMovieMotionHumanPosture.Digit
    | "trunkTurn";
}
