import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * One staged transfer between two fixed, parallel spacecraft handrails.
 * The performer is placed at rest within reach of the first rail, with
 * the named hand on the rail side of the body and a clear glide corridor.
 * The law validates the fixtures, rail geometry, clock and midpoint
 * clearance against the staged performer's arm reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the placement premise, handrail roles, clock units and midpoint clearance bound.
 * @evidence contracts/development/design.md#principled-representation One fixture owns both contact ids, and the same ramp duration bounds the acceleration and braking phases of the straight glide.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law reads two contact names on one fixture, a hand, two phase lengths and the free hand's midpoint clearance. The performer supplies the entry placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No target point or floor support is synthesized when a contact name is wrong.
 */
export interface IAutoMovieMotionHumanSpacecraftGlide {
  /** The subject id of the stationary spacecraft prop. */
  spacecraft: string;

  /** The fixed bar or handle that the hand pushes off. */
  departure: string;

  /** The fixed bar or handle that the same hand catches. */
  arrival: string;

  /** The hand facing the rail side of the cabin. */
  hand: AutoMovieHumanSide;

  /** Seconds spent in each of the two contact phases, finite and positive. */
  ramp: number;

  /** Seconds of contact-free, constant-speed travel, finite and positive. */
  coast: number;

  /** Inward grip displacement from the rail line at mid-coast, metres. Finite and positive. */
  handClearance: number;
}
