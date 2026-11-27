import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { AutoMovieEnginePhysicalJointChart } from "../AutoMovieEnginePhysicalJointChart";

/*
 * A free axis's coordinate, the one the joint's admission clamps
 * (`projectPhysicalJointRotation`): the chart's angle where the joint declares
 * a chart, else the twist coordinate `2 atan(q.axis / w)`; none for a
 * swing-twist gate, which has no coordinate per axis, so a gated joint's axes
 * stay free and the joints' pass restores its gate.
 * Parameter joint: The joint's profile.
 * Parameter relative: The child's anchor frame relative to the parent's, unit.
 * Parameter declared: The free axis.
 * Returns: Its coordinate, radians; none for a gated joint.
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
    : AutoMovieEnginePhysicalJointChart.nearest(joint, relative)[
        order.indexOf(declared.axis)
      ]!;
}
