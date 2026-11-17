import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * A touch's contact windows from `ready` to `relax`: the hand's grip on
 * what it bears on, and the touching arm's segments that lie on a person's
 * segment while the hand is on its region, as a self-hug's forearms lie on
 * each other and on the chest: what a touch row declares as rests, each
 * arm's rests, and the windows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: Whose arm: the leading hand's or the other's. part: The arm's segment. on: The bone it lies along, named as for the right hand leading; its side is exchanged when the left hand leads.
 * @evidence contracts/development/design.md#principled-representation hand: Whose arm: the leading hand's or the other's. part: The arm's segment. on: The bone it lies along, named as for the right hand leading; its side is exchanged when the left hand leads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.sided, declared); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.sided, rest); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.sided, return); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.windows, rests); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.windows, rest); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.sided).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchContacts {
  /**
   * A rest as a touch row declares it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and how a side is read.
   * @evidence contracts/development/design.md#principled-representation The hand whose arm it is, its segment and the bone, so a row reads the same whichever hand leads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by `sided`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bone is the rig's own name, mirrored with the leading hand rather than restated per side.
   */
  export interface IDeclared {
    /** Whose arm: the leading hand's or the other's. */
    hand: "first" | "other";

    /** The arm's segment. */
    part: "upperArm" | "lowerArm";

    /** The bone it lies along, named as for the right hand leading; its side is exchanged when the left hand leads. */
    on: AutoMovieHumanoidBone;
  }

  /**
   * One arm's rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The arm's segment, the bone it lies along and whose bone it is.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all written into the window.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The arm's own side is the touch's, so only its segment is named.
   */
  export interface IRest {
    /** The touching arm's segment. */
    part: "upperArm" | "lowerArm";

    /** The bone it lies along. */
    on: AutoMovieHumanoidBone;

    /** The person whose bone it is. */
    subject: string;
  }
}
