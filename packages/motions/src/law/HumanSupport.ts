import type { AutoMovieMotionTarget } from "@automovie/interface";

import type { lieDown } from "../floor/lieDown";

/**
 * The supports a body moves its weight across: a sequence of stances, each
 * the set of the body's parts that touch something and how they bear,
 * which the support planner (`support`) solves into key postures and moves
 * between, a contact of the next stance bearing before one the next stance
 * lacks lets go, and a part on another target in the next stance stepping
 * there, let go, swung and set down (the support sequences of Escande,
 * Kheddar and Miossec 2013,
 * Robot Auton Syst 61:428, and Hauser's non-gaited motion, Hauser, Bretl and
 * Latombe 2005).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a stance is, how a sequence is read and its sources.
 * @evidence contracts/development/design.md#principled-representation A stance is a set of contacts, each a part, a target and how it bears, the representation a support sequence planner takes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The part, the contact and the stance, read by the support law and its rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The target is the vocabulary's own target union; no place is typed by the record.
 */
export namespace HumanSupport {
  /** A body part that bears: a foot on its ball and toes, a hand on its palm, a knee on the shin's top, the seat on the buttocks, the back or the front of the trunk lying on it. */
  export type Part =
    | "leftFoot"
    | "rightFoot"
    | "leftHand"
    | "rightHand"
    | "leftKnee"
    | "rightKnee"
    | "seat"
    | "back"
    | "front";

  /** The parts, as data. */
  export const PARTS: readonly Part[] = [
    "leftFoot",
    "rightFoot",
    "leftHand",
    "rightHand",
    "leftKnee",
    "rightKnee",
    "seat",
    "back",
    "front",
  ];

  /**
   * One contact of a stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A part on a target, bearing or gripping.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the support law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target is the shared target union.
   */
  export interface IContact {
    /** The part. */
    part: Part;

    /** Where it touches: a floor point, a prop's surface, a person's region; `on`, the surface the action is given (`support.IParams.on`), the part placed on its own side of it by the body's own width; anywhere on the floor the stance's solve lays it when absent, so a stance can name the parts it rests on without a place. */
    target?: AutoMovieMotionTarget | "on";

    /** How it touches: `bear`, laid on a surface whose up it faces and pressed by the body's weight; `grip`, a hand closed on a handle, holding as well as pressing. */
    kind: "bear" | "grip";

    /** How far in from the edge of the action's surface a contact on it (`on`) lies along the heading, as a share of the forearm and hand's length: positive onto a surface ahead of the body, negative onto one behind it; at the edge when absent. */
    inset?: number;

    /** Whether the part is set down anew in this stance, stepping from where it bore before to where the stance's solve lays it; a part that bears on from the stance before stays where it bore when absent. */
    step?: boolean;
  }

  /**
   * One stance: the contacts the body rests on at once.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation A set of contacts and the time the move into it takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the support law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed: the planner solves it from the contacts.
   */
  export interface IStance {
    /** The contacts, at least one. */
    contacts: readonly IContact[];

    /** Seconds the move into this stance takes; the planner's own when absent. */
    seconds?: number;

    /** The heading the stance faces, degrees about the vertical from the heading the body enters with: half a turn after a roll from the back to the front; the entry's when absent. */
    turn?: number;

    /** The event the stance is held at, unique in the sequence; `stance<i>` when absent. */
    event?: string;

    /** The posture the stance's solve stays nearest, by its whole body's tilt and its joints (degrees); the posture the body enters with when absent. A stance without targets is shaped by it: kneeling, squatting, standing. */
    prefer?: lieDown.IPose;
  }
}
