import type {
  IAutoMovieAngleRange,
  IAutoMovieMeasurePhysicalJointLimits,
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieRigidTransform,
  IAutoMovieSwingTwistRange,
  IAutoMovieVector3,
} from "@automovie/interface";

import { swingTwistRange } from "../kinematics/swingTwistRange";
import { Quaternion } from "../math/Quaternion";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";
import { PhysicalRotationVector } from "./PhysicalRotationVector";

/**
 * Measure every native angular constraint from displayed bone frames. A ball
 * joint gated by swing and twist (`range`) is measured on that gate, the set
 * its projection admits (`projectPhysicalJointRotation`): the swing (`x`) past
 * the region's radius on its great circle and the twist (`y`) past its
 * interval, radians, the third entry zero. A joint that declares a sequential
 * chart (`order`) is read in it, as the solver admits it
 * (`projectPhysicalJointRotation`): each Tait-Bryan angle of the chart's
 * reading (`AutoMoviePhysicalJointChart.nearest`) against its free axis's
 * range, a locked axis's, with the turn that reading leaves about it, against
 * zero; a pose the solver admitted then reads within its limits. Otherwise
 * free-axis limits use the wrapped twist projection 2 atan2(q.axis,q.w). Locked
 * coordinates use 2 asin(q.axis), avoiding a false pi error when another free
 * axis is at a half turn. Results are radians; native numerical tolerance
 * belongs to the caller, rather than being subtracted from the measurement.
 */
export function measurePhysicalJointLimits(
  joint: IAutoMovieMotionGeometry["joints"][number] &
    Pick<AutoMoviePhysicalJointChart.IJoint, "order"> &
    Pick<IAutoMoviePhysicalJoint, "range">,
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): IAutoMovieMeasurePhysicalJointLimits.IResult {
  const relative: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
    ),
    Quaternion.multiply(child.rotation, joint.childFrame.rotation),
  );
  if (joint.range !== undefined) {
    const gate: NonNullable<IAutoMoviePhysicalJoint["range"]> = joint.range;
    const own: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      Quaternion.multiply(gate.basis, Quaternion.normalize(relative)),
      Quaternion.inverse(gate.basis),
    );
    const reading: IAutoMovieSwingTwistRange.IReading = swingTwistRange.read(
      own,
      gate.frame,
    );
    const interval: IAutoMovieAngleRange = gate.constraint.swingTwist!.twist;
    const turned: number = nearestAngleAlias(reading.twist, interval);
    const radian: number = Math.PI / 180;
    return [
      {
        axis: "x",
        angle: reading.swing * radian,
        violation:
          Math.max(
            0,
            reading.swing - swingTwistRange.radius(gate.frame, reading.azimuth),
          ) * radian,
      },
      {
        axis: "y",
        angle: turned * radian,
        violation:
          Math.max(0, interval.min - turned, turned - interval.max) * radian,
      },
      { axis: "z", angle: 0, violation: 0 },
    ];
  }
  if (joint.order !== undefined) {
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] = joint.order;
    const reading: Record<IAutoMoviePhysicalJointAxis["axis"], number> = {
      x: 0,
      y: 0,
      z: 0,
    };
    const unit: IAutoMovieRigidTransform["rotation"] =
      Quaternion.normalize(relative);
    const values: number[] = AutoMoviePhysicalJointChart.nearest(joint, unit);
    // What the chart's reading leaves of the rotation turns the locked axes:
    // a locked axis reads its own angle plus that turn's component about it.
    const left: IAutoMovieVector3 = PhysicalRotationVector.log(
      Quaternion.multiply(
        unit,
        Quaternion.inverse(AutoMoviePhysicalJointChart.compose(order, values)),
      ),
    );
    values.forEach((value: number, at: number): void => {
      const axis: IAutoMoviePhysicalJointAxis["axis"] | undefined = order[at];
      if (axis === undefined) return;
      reading[axis] = joint.axes.some(
        (coordinate: (typeof joint.axes)[number]): boolean =>
          coordinate.axis === axis,
      )
        ? value
        : value + left[axis];
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
