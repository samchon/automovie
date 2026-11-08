import type {
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/** Measure every native angular constraint from displayed bone frames.
 * Free-axis limits use the wrapped twist projection 2 atan2(q.axis,q.w).
 * Locked coordinates use 2 asin(q.axis), avoiding a false pi error when another
 * free axis is at a half turn. Results are radians; native numerical tolerance
 * belongs to the caller, rather than being subtracted from the measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Measure every native angular constraint from displayed bone frames) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Measure every native angular constraint from displayed bone frames) directly over its typed inputs (`joint`, `parent`, `child`) as nested iteration of depth 2 (map over (["x", "y", "z"] as const); find over joint.axes), delegating to `Quaternion.multiply`, `Quaternion.inverse`, `Math.atan2`, `Math.asin`, `Math.max`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 40 lines and 3 top-level statements that reuses `Quaternion.multiply`, `Quaternion.inverse`, `Math.atan2`, `Math.asin`, `Math.max` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `joint`, `parent`, `child`; the dominant cost is nested iteration of depth 2 (map over (["x", "y", "z"] as const); find over joint.axes), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function measurePhysicalJointLimits(
  joint: IAutoMovieMotionGeometry["joints"][number],
  parent: P.ITransform,
  child: P.ITransform,
): { axis: "x" | "y" | "z"; angle: number; violation: number }[] {
  const relative: P.ITransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
    ),
    Quaternion.multiply(child.rotation, joint.childFrame.rotation),
  );
  const sign: number = relative.w < 0 ? -1 : 1;
  return (["x", "y", "z"] as const).map(
    (
      axis: "x" | "y" | "z",
    ): { axis: "x" | "y" | "z"; angle: number; violation: number } => {
      const range:
        | IAutoMovieMotionGeometry["joints"][number]["axes"][number]
        | undefined = joint.axes.find(
        (coordinate: (typeof joint.axes)[number]): boolean =>
          coordinate.axis === axis,
      );
      const raw: number = range
        ? 2 * Math.atan2(relative[axis], relative.w)
        : 2 * Math.asin(Math.max(-1, Math.min(1, relative[axis] * sign)));
      const angle: number = Math.atan2(Math.sin(raw), Math.cos(raw));
      const distance: (endpoint: number) => number = (
        endpoint: number,
      ): number =>
        Math.abs(
          Math.atan2(Math.sin(angle - endpoint), Math.cos(angle - endpoint)),
        );
      return {
        axis,
        angle,
        violation: range
          ? angle >= range.minimum && angle <= range.maximum
            ? 0
            : Math.min(distance(range.minimum), distance(range.maximum))
          : Math.abs(angle),
      };
    },
  );
}
