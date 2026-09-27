import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinReliefPose } from "../structures/IAutoMovieHumanBodySkinReliefPose";

/**
 * The factor each vertex of a surface wears on the skin's anatomical relief
 * in a pose: one at rest, rising where a bent joint folds the skin and
 * falling where it stretches it.
 *
 * For each joint of the table on either side, the share of its flexion
 * range the pose has travelled from rest, `f` (positive toward the range's
 * maximum, negative toward its minimum, zero when the pose leaves it at
 * rest), and each vertex's side of it, `s`, from its rest normal against
 * the joint frame's flexion side (+1 on the side a flexion carries the bone
 * toward, −1 on the other, ramping across the flank). Near the joint (a
 * Gaussian of the axial distance from its centre over the table's width,
 * within its reach of the bone's axis), the vertex's factor gains
 * `deepen · max(0, f·s)` and loses `flatten · max(0, −f·s)`, never below
 * zero. The frame is the rest skeleton's: `Y` from the joint to its bone's
 * tail, `X = Y × reference`, `Z = X × Y`. With no table joint off rest the
 * surface keeps the relief as drawn and this returns `null`.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Makes the skin's creases deepen where a bent joint folds it and its wrinkles flatten where it stretches.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Implements the relief weights: the travelled share of each joint's range, the vertex's side by its rest normal and the axial Gaussian within the reach.
 */
export const humanBodyReliefWeights = (props: {
  basis: IAutoMovieHumanBodyBasis;
  table: IAutoMovieHumanBodySkinReliefPose;
  /** The surface at the rest pose and its normals, three numbers a vertex. */
  positions: number[];
  normals: number[];
  /** The rest landmarks the joint centres are read from. */
  landmarks: Record<string, IAutoMovieVector3>;
  pose: readonly IAutoMovieJointPose[];
}): number[] | null => {
  const count = props.positions.length / 3;
  const weights = new Array<number>(count).fill(1);
  let moved = false;
  for (const entry of props.table.joints)
    for (const side of ["left", "right"]) {
      const joint = props.basis.joints.find(
        (one) => one.bone === side + entry.bone,
      );
      const row = props.pose.find((one) => one.bone === side + entry.bone);
      if (joint === undefined || row === undefined || row.flexion === null)
        continue;
      const rest = joint.neutral.flexion;
      const range = joint.constraint?.flexion;
      if (range === undefined || range === null) continue;
      const end = row.flexion >= rest ? range.max : range.min;
      if (end === rest) continue;
      const travelled = Math.min(
        1,
        Math.max(-1, (row.flexion - rest) / Math.abs(end - rest)),
      );
      if (travelled === 0) continue;
      moved = true;
      const head = props.landmarks[joint.head];
      const tail = props.landmarks[joint.tail];
      const axis = unit([tail.x - head.x, tail.y - head.y, tail.z - head.z]);
      const x = unit(cross(axis, joint.reference));
      const z = cross(x, axis);
      for (let v = 0; v < count; v++) {
        const d = [
          props.positions[v * 3] - head.x,
          props.positions[v * 3 + 1] - head.y,
          props.positions[v * 3 + 2] - head.z,
        ];
        const along = dot(d, axis);
        const radial = Math.hypot(
          d[0] - along * axis[0],
          d[1] - along * axis[1],
          d[2] - along * axis[2],
        );
        if (radial > entry.reachMetres) continue;
        const near = Math.exp(-((along / entry.sigmaMetres) ** 2));
        if (near < 1e-4) continue;
        const facing =
          props.normals[v * 3] * z[0] +
          props.normals[v * 3 + 1] * z[1] +
          props.normals[v * 3 + 2] * z[2];
        const sideOf = Math.max(-1, Math.min(1, facing / 0.3));
        const fold = travelled * sideOf;
        weights[v] = Math.max(
          0,
          weights[v] +
            near *
              (props.table.deepen * Math.max(0, fold) -
                props.table.flatten * Math.max(0, -fold)),
        );
      }
    }
  return moved ? weights : null;
};

const dot = (a: number[], b: number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: number[], b: number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: number[]): number[] => {
  const length = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / length, a[1] / length, a[2] / length];
};
