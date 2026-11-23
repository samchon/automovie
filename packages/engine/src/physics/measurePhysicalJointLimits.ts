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
