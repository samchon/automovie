import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Wheel a bicycle by hand: walk or run beside it with one hand on its near
 * handlebar grip while the scene rolls it along its own course, as a
 * triathlete does between the rack and the mount line. The bicycle's course
 * owns its path, speed, stops and wheel roll; the athlete keeps the entered
 * place beside it and steps with it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bicycle, the side walked on, the duration and who owns the path.
 * @evidence contracts/development/design.md#principled-representation A scene subject id, an anatomical side and seconds; the bicycle's motion stays with its prop.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanBikeGuide reads this record; the course and grip geometry come from the scene bicycle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No path or speed is duplicated here, so the athlete cannot drift from the bicycle it holds.
 */
export interface IAutoMovieMotionHumanBikeGuide {
  /** Subject id of the bicycle. */
  on: string;

  /** The side of the bicycle the athlete walks on, whose hand holds that side's grip; left when absent. */
  side?: AutoMovieHumanSide;

  /** Duration in seconds, positive: the span of the bicycle's course to walk beside. */
  duration: number;
}
