import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodyReliefWeightsInput } from "./IHumanBodyReliefWeightsInput";

/**
 * The factor each vertex of a surface wears on the skin's anatomical relief in a pose: one at rest, rising where a bent joint folds the skin and falling where it stretches it.
 *
 * For each joint of the table on either side, the share of its flexion range the pose has travelled from rest, `f` (positive toward the range's maximum, negative toward its minimum, zero when the pose leaves it at rest), and each vertex's side of it, `s`, from its rest normal against the joint frame's flexion side (+1 on the side a flexion carries the bone toward, −1 on the other, ramping across the flank). Near the joint (a Gaussian of the axial distance from its centre over the table's width, within its reach of the bone's axis), the vertex's factor gains `deepen · max(0, f·s)` and loses `flatten · max(0, −f·s)`, never below zero. The frame is the rest skeleton's: `Y` from the joint to its bone's tail, `X = Y × reference`, `Z = X × Y`. With no table joint off rest the surface keeps the relief as drawn and this returns `null`.
 *
 * The 1e-4 Gaussian-tail cutoff and 0.3 normal-facing transition are fixed visual-response policies, not measured crease or tissue parameters. Aligned admitted rest geometry supplies finite noncollapsed frames; the function does not independently admit a clinical pose or measure actual folds.
 *
 * @evidence contracts/common.md#principled-implementation Each declared joint's normalized flexion travel and source-rest normal facing modulate a Gaussian axial field within the authored radial reach, adding deepening or flattening with a nonnegative result.
 * @evidence contracts/common.md#clear-and-simple-design One table/joint traversal accumulates a shared per-native-vertex scalar array and returns null when no eligible joint leaves rest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing pose/range entries contribute no change; the response uses authored amplitudes and declared numerical tail/facing policy, without asserting measured crease depth, contact or clinical admission.
 * @evidence contracts/common.md#meaningful-documentation The prose names rest frame axes, range normalization, metre reach/width, unchanged/null behavior and the authored policy's limitations.
 * @evidence contracts/performance.md#efficient-algorithms Each table side scans basis/pose joints and, when moved, all V vertices, yielding O(J times (B+P+V)); radial and tail branches skip scalar contribution work without changing the traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Rest frame and travel are computed once per moved joint, then reused across vertices; caller-owned same-revision rest positions/normals avoid an independent shape evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned weight array escapes, or null when unchanged; joint-frame vectors and traversal state expire on return, with no persistent geometry cache, handle or task.
 */
export const humanBodyReliefWeights: (props: IHumanBodyReliefWeightsInput) => number[] | null = (props: IHumanBodyReliefWeightsInput): number[] | null => {
  const count: number = props.positions.length / 3;
  const weights: number[] = new Array<number>(count).fill(1);
  let moved: boolean = false;
  for (const entry of props.table.joints)
    for (const side of ["left", "right"]) {
      const joint: IAutoMovieHumanBodyBasis["joints"][number] | undefined = props.basis.joints.find(
        (one: IAutoMovieHumanBodyBasis["joints"][number]): boolean => one.bone === side + entry.bone,
      );
      const row: IAutoMovieJointPose | undefined = props.pose.find((one: IAutoMovieJointPose): boolean => one.bone === side + entry.bone);
      if (joint === undefined || row === undefined || row.flexion === null)
        continue;
      const rest: number = joint.neutral.flexion;
      const range: NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["constraint"]>["flexion"] | undefined = joint.constraint?.flexion;
      if (range === undefined || range === null) continue;
      const end: number = row.flexion >= rest ? range.max : range.min;
      if (end === rest) continue;
      const travelled: number = Math.min(
        1,
        Math.max(-1, (row.flexion - rest) / Math.abs(end - rest)),
      );
      if (travelled === 0) continue;
      moved = true;
      const head: IAutoMovieVector3 = props.landmarks[joint.head];
      const tail: IAutoMovieVector3 = props.landmarks[joint.tail];
      const axis: number[] = unit([tail.x - head.x, tail.y - head.y, tail.z - head.z]);
      const x: number[] = unit(cross(axis, joint.reference));
      const z: number[] = cross(x, axis);
      for (let v: number = 0; v < count; v++) {
        const d: number[] = [
          props.positions[v * 3] - head.x,
          props.positions[v * 3 + 1] - head.y,
          props.positions[v * 3 + 2] - head.z,
        ];
        const along: number = dot(d, axis);
        const radial: number = Math.hypot(
          d[0] - along * axis[0],
          d[1] - along * axis[1],
          d[2] - along * axis[2],
        );
        if (radial > entry.reachMetres) continue;
        const near: number = Math.exp(-((along / entry.sigmaMetres) ** 2));
        if (near < 1e-4) continue;
        const facing: number =
          props.normals[v * 3] * z[0] +
          props.normals[v * 3 + 1] * z[1] +
          props.normals[v * 3 + 2] * z[2];
        const sideOf: number = Math.max(-1, Math.min(1, facing / 0.3));
        const fold: number = travelled * sideOf;
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

const dot: (a: number[], b: number[]) => number = (a: number[], b: number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross: (a: number[], b: number[]) => number[] = (a: number[], b: number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit: (a: number[]) => number[] = (a: number[]): number[] => {
  const length: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / length, a[1] / length, a[2] / length];
};
