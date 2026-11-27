import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Wheel a bicycle by hand: walk or run beside it with one hand on its near
 * handlebar grip while the scene rolls it along its own course, as a triathlete
 * does between the rack and the mount line. The bicycle's course owns its path,
 * speed, stops and wheel roll; the athlete keeps the entered place beside it
 * and steps with it.
 */
export interface IAutoMovieMotionHumanBikeGuide {
  /** Subject id of the bicycle. */
  on: string;

  /**
   * The side of the bicycle the athlete walks on, whose hand holds that side's
   * grip; left when absent.
   */
  side?: AutoMovieHumanSide;

  /**
   * Duration in seconds, positive: the span of the bicycle's course to walk
   * beside.
   */
  duration: number;
}
