import { IAutoMovieTravelMotion } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTOMOVIE_FULL_TURN_EPSILON } from "./constants/AUTOMOVIE_FULL_TURN_EPSILON";

/** A travel axis this short or shorter has no direction. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Validate the one degree of freedom a moving member travels on.
 *
 * The label names what is moving so the refusal reads as the author wrote it: a
 * door leaf and a lift car share this arithmetic, and a message that called a
 * car a panel would send its author looking through the openings for it.
 *
 * Axis components/computed length must be finite, length above 1e-12, and a revolute pivot finite. Rest-relative `min` must be finite and at most zero, `max` finite and at least zero, with `max > min`. Revolute span is capped at `2 * PI + AUTOMOVIE_FULL_TURN_EPSILON` radians for the swept-envelope solver. Prismatic values are metres and revolute values radians. Findings use `path`.
 *
 * @param motion Travel to check.
 * @param path Violation path of the motion.
 * @param label What is moving, such as `panel` or `carriage`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation A one-degree-of-freedom joint needs a usable axis, a range containing its rest value 0, and a non-empty interval; the full-turn cap is shared with the swept-envelope solver so a range validation admits is one that solver can enumerate.
 * @evidence contracts/common.md#clear-and-simple-design One rule for both panel and carriage travel, parameterized only by the moving member's name, so doors and lifts cannot drift apart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No member kind is special-cased; prismatic and revolute differ only where the contract does, the pivot and the full-turn cap.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the label exists, every axis, pivot and range rule, the cap and who relies on it, the units, and the path.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work for one motion, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one motion per call; each panel and carriage is checked once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most a bounded handful of violations to the caller's collector and retains nothing.
 */
export const validateBuiltTravelMotion: (
  motion: IAutoMovieTravelMotion,
  path: string,
  label: string,
  collector: ViolationCollector,
) => void = (
  motion: IAutoMovieTravelMotion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  collector.finiteVector(`${path}.axis`, motion.axis, `${label} travel axis`);
  const length: number = Vector3.length(motion.axis);
  if (!Number.isFinite(length) || length <= AXIS_EPSILON)
    collector.push(
      "range",
      `${path}.axis`,
      `${label} travel axis must have finite non-zero computed length`,
      motion.axis,
    );
  if (motion.kind === "revolute")
    collector.finiteVector(`${path}.pivot`, motion.pivot, `${label} pivot`);
  if (!Number.isFinite(motion.min) || motion.min > 0)
    collector.push(
      "range",
      `${path}.min`,
      `${label} travel is measured from its rest pose, so the lowest value must be a finite number <= 0, but was ${motion.min}`,
      motion.min,
    );
  if (!Number.isFinite(motion.max) || motion.max < 0)
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
};
