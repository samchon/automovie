import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";

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
  /** The parts, as data. */
  export const PARTS: readonly IAutoMovieMotionHumanSupport.Part[] = [
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
}
