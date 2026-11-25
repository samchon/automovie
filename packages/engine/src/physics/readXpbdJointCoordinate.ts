import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";

/**
 * A free axis's coordinate, the one the joint's admission clamps
 * (`projectPhysicalJointRotation`): the chart's angle where the joint declares
 * a chart, else the twist coordinate `2 atan(q.axis / w)`; none for a
 * swing-twist gate, which has no coordinate per axis, so a gated joint's axes
 * stay free and the joints' pass restores its gate.
 *
 * @param joint The joint's profile.
 * @param relative The child's anchor frame relative to the parent's, unit.
 * @param declared The free axis.
 * @returns Its coordinate, radians; none for a gated joint.
 */
export function readXpbdJointCoordinate(
  joint: IAutoMoviePhysicalJoint,
  relative: IAutoMovieQuaternion,
  declared: IAutoMoviePhysicalJointAxis,
): number | null {
  if (joint.range !== undefined) return null;
  const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
    joint.order;
  const sign: number = relative.w < 0 ? -1 : 1;
  return order === undefined
    ? 2 * Math.atan2(relative[declared.axis] * sign, Math.abs(relative.w))
    : AutoMoviePhysicalJointChart.nearest(joint, relative)[
        order.indexOf(declared.axis)
      ]!;
}
