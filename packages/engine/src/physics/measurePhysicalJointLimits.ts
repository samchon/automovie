import type {
  IAutoMovieMeasurePhysicalJointLimits,
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";

/**
 * Measure every native angular constraint from displayed bone frames. A joint
 * that declares a sequential chart (`order`) is read in it, as the solver
 * admits it (`projectPhysicalJointRotation`): each Tait-Bryan angle of the
 * branch nearest the ranges (`AutoMoviePhysicalJointChart.nearest`) against its
 * free axis's range, a locked axis's against zero; a pose the solver admitted
 * then reads within its limits. Otherwise free-axis limits use the wrapped
 * twist projection 2 atan2(q.axis,q.w). Locked coordinates use 2 asin(q.axis),
 * avoiding a false pi error when another free axis is at a half turn. Results
 * are radians; native numerical tolerance belongs to the caller, rather than
 * being subtracted from the measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Measure every native angular constraint from displayed bone frames) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation A joint with a sequential chart is read by the chart's own branch nearest its ranges (`AutoMoviePhysicalJointChart.nearest`), the reading the solver admits it by (`projectPhysicalJointRotation`), so an admitted pose reads within its limits; otherwise each free coordinate is the wrapped twist projection and each locked one 2 asin(q.axis). The premises are the units, frames and ranges stated in its parameter documentation; apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative rotation, then either the chart's reading or the per-axis projection, each mapped onto the three axes' violations; it reuses `Quaternion` and `AutoMoviePhysicalJointChart` from their owners and adds no option beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call: one relative rotation, at most one chart extraction with its twin branch, and three range lookups over the joint's at most three axes. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function measurePhysicalJointLimits(
  joint: IAutoMovieMotionGeometry["joints"][number] &
    Pick<AutoMoviePhysicalJointChart.IJoint, "order">,
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): IAutoMovieMeasurePhysicalJointLimits.IResult {
  const relative: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
    ),
    Quaternion.multiply(child.rotation, joint.childFrame.rotation),
  );
  if (joint.order !== undefined) {
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] = joint.order;
    const reading: Record<IAutoMoviePhysicalJointAxis["axis"], number> = {
      x: 0,
      y: 0,
      z: 0,
    };
    AutoMoviePhysicalJointChart.nearest(
      joint,
      Quaternion.normalize(relative),
    ).forEach((value: number, at: number): void => {
      const axis: IAutoMoviePhysicalJointAxis["axis"] | undefined = order[at];
      if (axis !== undefined) reading[axis] = value;
    });
    return (["x", "y", "z"] as const).map(
      (
        axis: "x" | "y" | "z",
      ): IAutoMovieMeasurePhysicalJointLimits.IResult[number] => {
        const angle: number = reading[axis];
        const range:
          | IAutoMovieMotionGeometry["joints"][number]["axes"][number]
          | undefined = joint.axes.find(
          (coordinate: (typeof joint.axes)[number]): boolean =>
            coordinate.axis === axis,
        );
        return {
          axis,
          angle,
          violation: range
            ? Math.max(0, range.minimum - angle, angle - range.maximum)
            : Math.abs(angle),
        };
      },
    );
  }
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
