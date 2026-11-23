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
