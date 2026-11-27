import {
  IAutoMovieTravelMotion,
  type IAutoMovieViolationAppendSink,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AUTOMOVIE_FULL_TURN_EPSILON } from "../AUTOMOVIE_FULL_TURN_EPSILON";

/** A travel axis this short or shorter has no direction. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Validate the one degree of freedom a moving member travels on.
 *
 * The label names what is moving so the refusal reads as the author wrote it: a
 * door leaf and a lift car share this arithmetic, and a message that called a
 * car a panel would send its author looking through the openings for it.
 *
 * Axis components/computed length must be finite, length above 1e-12, and a
 * revolute pivot finite. Rest-relative `min` must be finite and at most zero,
 * `max` finite and at least zero, with `max > min`. Revolute span is capped at
 * `2 * PI + AUTOMOVIE_FULL_TURN_EPSILON` radians for the swept-envelope solver.
 * Prismatic values are metres and revolute values radians. Findings use
 * `path`.
 *
 * @param motion Travel to check.
 * @param path Violation path of the motion.
 * @param label What is moving, such as `panel` or `carriage`.
 * @param collector Sink that receives the violations.
 */
export function validateBuiltTravelMotion(
  motion: IAutoMovieTravelMotion,
  path: string,
  label: string,
  collector: IAutoMovieViolationAppendSink,
): void {
  const length: number = Vector3.length(motion.axis);
  if (length <= AXIS_EPSILON)
    collector.push(
      "range",
      `${path}.axis`,
      `${label} travel axis must have finite non-zero computed length`,
      motion.axis,
    );
  if (motion.min > 0)
    collector.push(
      "range",
      `${path}.min`,
      `${label} travel is measured from its rest pose, so the lowest value must be a finite number <= 0, but was ${motion.min}`,
      motion.min,
    );
  if (motion.max < 0)
    collector.push(
      "range",
      `${path}.max`,
      `${label} travel is measured from its rest pose, so the highest value must be a finite number >= 0, but was ${motion.max}`,
      motion.max,
    );
  else if (motion.max <= motion.min)
    collector.push(
      "range",
      `${path}.max`,
      `a movable ${label} needs travel, but its range was [${motion.min}, ${motion.max}]`,
      motion.max,
    );
  else if (
    motion.kind === "revolute" &&
    motion.max - motion.min > 2 * Math.PI + AUTOMOVIE_FULL_TURN_EPSILON
  )
    collector.push(
      "range",
      `${path}.max`,
      `a turning ${label} may travel at most a full turn, but its range spanned ${motion.max - motion.min} radians`,
      motion.max,
    );
}
