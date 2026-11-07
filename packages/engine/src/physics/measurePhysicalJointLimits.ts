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
