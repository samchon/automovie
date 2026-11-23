import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Leading a horse on foot: one hand takes the horse's moving lead rope, holds
 * it while the handler walks, and lets it go, as an arm overlay over an
 * authored walk.
 *
 * The walk underneath owns the steps, the root and the other arm. The horse
 * prop owns where the rope is at every film second, so the scene stages the
 * horse's course and the handler's walk together; the action refuses a sample
 * whose displayed hand cannot reach the rope.
 */
export interface IAutoMovieMotionHumanLeadHorse {
  /** The horse prop's subject id in the performance. */
  on: string;

  /** The hand that holds the rope. */
  hand: AutoMovieHumanSide;

  /**
   * The horse's affordance id for the held run of a round rope; `lead` when
   * absent.
   */
  point?: string;

  /**
   * Seconds the action lasts, acquiring and releasing included, more than twice
   * `transition`. No natural value is defined: choose it for the beat
   * (provisional, missing).
   */
  duration: number;

  /**
   * Seconds the hand takes to reach the rope, and again to let it go, positive.
   * No natural value is defined: choose it for the beat (provisional,
   * missing).
   */
  transition: number;
}
