import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * One staged transfer between two fixed, parallel spacecraft handrails. The
 * performer is placed at rest within reach of the first rail, with the named
 * hand on the rail side of the body and a clear glide corridor. The law
 * validates the fixtures, rail geometry, clock and midpoint clearance against
 * the staged performer's arm reach.
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

  /**
   * Inward grip displacement from the rail line at mid-coast, metres. Finite
   * and positive.
   */
  handClearance: number;
}
