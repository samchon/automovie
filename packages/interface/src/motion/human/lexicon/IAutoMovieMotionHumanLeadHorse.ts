import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Leading a horse on foot: one hand takes the horse's moving lead rope,
 * holds it while the handler walks, and lets it go, as an arm overlay over
 * an authored walk.
 *
 * The walk underneath owns the steps, the root and the other arm. The horse
 * prop owns where the rope is at every film second, so the scene stages the
 * horse's course and the handler's walk together; the action refuses a
 * sample whose displayed hand cannot reach the rope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the support, the hand, the rope contact, the film-second duration and the acquire and release intervals.
 * @evidence contracts/development/design.md#principled-representation One named contact on one prop for one arm over a finite interval; positive timing that leaves a hold between acquiring and releasing is checked when the action is planned, and reach at each sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The walk owns travel and feet and the horse prop owns the rope's world frame; this record names only what the arm does.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No rope position, horse course or handling technique is supplied here; the rope is read from the prop.
 */
export interface IAutoMovieMotionHumanLeadHorse {
  /** The horse prop's subject id in the performance. */
  on: string;

  /** The hand that holds the rope. */
  side: AutoMovieHumanSide;

  /** The horse's affordance id for the held run of a round rope; `lead` when absent. */
  point?: string;

  /** Seconds the action lasts, acquiring and releasing included, more than twice `transition`. */
  seconds: number;

  /** Seconds the hand takes to reach the rope, and again to let it go, positive. */
  transition: number;
}
