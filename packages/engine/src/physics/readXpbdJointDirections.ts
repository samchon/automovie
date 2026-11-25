import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";

/**
 * The directions of a joint's motion subspace at a relative rotation, in its
 * parent's anchor frame: each free axis's, in the joint's axis order, as the
 * articulated solve moves it (the chart's axes at the configuration,
 * `AutoMoviePhysicalJointChart.directions`, or the frame's axes for a joint
 * without a chart), then the locked ones completing them to a basis: the normal
 * of two free directions, or, for one, the first locked direction made
 * perpendicular to it and their normal.
 *
 * @param joint The joint's profile.
 * @param relative The child's anchor frame relative to the parent's, unit.
 * @returns Three directions: the free ones first, then the locked.
 */
export function readXpbdJointDirections(
  joint: IAutoMoviePhysicalJoint,
  relative: IAutoMovieQuaternion,
): IAutoMovieVector3[] {
  const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
    joint.order;
  const chart: IAutoMovieVector3[] | undefined =
    order === undefined
      ? undefined
      : AutoMoviePhysicalJointChart.directions(
          order,
          AutoMoviePhysicalJointChart.nearest(joint, relative),
        );

  // An axis's direction: the chart's at the configuration, else the frame's.
  const along: (
    axis: IAutoMoviePhysicalJointAxis["axis"],
  ) => IAutoMovieVector3 = (
    axis: IAutoMoviePhysicalJointAxis["axis"],
  ): IAutoMovieVector3 =>
    chart === undefined ? UNIT[axis]! : chart[order!.indexOf(axis)]!;
  const free: IAutoMovieVector3[] = joint.axes.map(
    (declared: IAutoMoviePhysicalJointAxis): IAutoMovieVector3 =>
      along(declared.axis),
  );
  const locked: IAutoMovieVector3[] = AXES.filter(
    (axis: IAutoMoviePhysicalJointAxis["axis"]): boolean =>
      !joint.axes.some(
        (declared: IAutoMoviePhysicalJointAxis): boolean =>
          declared.axis === axis,
      ),
  ).map(along);

  // The locked directions complete the free ones to a basis.
  if (free.length === 2)
    return [...free, Vector3.normalize(Vector3.cross(free[0]!, free[1]!))];
  if (free.length === 1) {
    const f: IAutoMovieVector3 = Vector3.normalize(free[0]!);
    const l: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled(locked[0]!, f, -Vector3.dot(locked[0]!, f)),
    );
    return [free[0]!, l, Vector3.cross(f, l)];
  }
  return [...free, ...locked];
}

/** The joint frame's axes, in name order. */
const AXES: readonly IAutoMoviePhysicalJointAxis["axis"][] = ["x", "y", "z"];

/** Each joint-frame axis by name. */
const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
  x: { x: 1, y: 0, z: 0 },
  y: { x: 0, y: 1, z: 0 },
  z: { x: 0, y: 0, z: 1 },
};
