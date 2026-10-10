import {
  DEFAULT_JOINT_AXES,
  type IAutoMovieResolvedJointAngles,
  Quaternion,
  Vector3,
  decomposeJointRotation,
  jointToQuaternion,
  normalizeJointAxes,
  toClinicalAngle,
  validatePose,
} from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * Read an actual articulation through an admitted clinical coordinate chart.
 *
 * The engine owns the principal inverse. Its orthonormal [flex, abduction,
 * handed twist] basis makes proximal order Rz(t) Ry(a) Rx(f), whose second
 * chart is (f+180, 180-a, t+180), and distal order Ry(a) Rx(f) Rz(t), whose
 * second chart is (180-f, a+180, t+180). The handed twist sign is restored
 * before the existing rest-frame lift converts rig degrees to clinical ones.
 * Each angle is reduced by full turns, never clamped to a motion limit.
 *
 * An authored reference is retained only when it reconstructs the actual
 * quaternion and passes the same pose admission. Otherwise the principal
 * and alternate charts are checked in that order. This preserves a permitted
 * elbow flexion past 90 degrees without presenting its equivalent 180-degree
 * held-axis rotation as a physiological motion. No admitted equivalent chart
 * means refusal. Quaternion agreement uses a 1e-12 component arithmetic
 * tolerance, not a clinical angular uncertainty or a registration claim.
 */
export function readHumanBodyAdmittedJointRotation(
  rig: IAutoMovieHumanBodySkeletonRig,
  reference: IAutoMovieJointPose,
  rotation: IAutoMovieQuaternion,
): IAutoMovieResolvedJointAngles {
  const axes = normalizeJointAxes(
    rig.axes[reference.bone] ?? DEFAULT_JOINT_AXES,
    "body actual joint coordinates",
  );
  const frame = rig.frames[reference.bone];
  const actual = Quaternion.normalize(rotation);
  const admits = (candidate: IAutoMovieResolvedJointAngles): boolean => {
    const forward = jointToQuaternion(candidate, axes, frame);
    const sign =
      forward.x * actual.x +
        forward.y * actual.y +
        forward.z * actual.z +
        forward.w * actual.w <
      0
        ? -1
        : 1;
    const error = Math.max(
      ...(["x", "y", "z", "w"] as const).map((axis) =>
        Math.abs(forward[axis] * sign - actual[axis]),
      ),
    );
    return (
      error <= 1e-12 &&
      validatePose({
        skeleton: rig.skeleton,
        pose: {
          skeleton: rig.skeleton.id,
          root: null,
          joints: [{ bone: reference.bone, ...candidate }],
        },
      }).items.length === 0
    );
  };
  const authored: IAutoMovieResolvedJointAngles = {
    flexion: reference.flexion ?? frame?.flexion?.neutral ?? 0,
    abduction: reference.abduction ?? frame?.abduction?.neutral ?? 0,
    twist: reference.twist ?? frame?.twist?.neutral ?? 0,
  };
  if (admits(authored)) return authored;
  const principal = decomposeJointRotation(rotation, axes, frame);
  if (admits(principal)) return principal;
  const raw = decomposeJointRotation(rotation, axes);
  const handed =
    Vector3.dot(axes.twist, Vector3.cross(axes.flexion, axes.abduction)) >= 0
      ? 1
      : -1;
  const turn = (degrees: number): number =>
    ((((degrees + 180) % 360) + 360) % 360) - 180;
  const alternate: IAutoMovieResolvedJointAngles = {
    flexion: toClinicalAngle(
      turn(
        axes.twistPlacement === "distal"
          ? 180 - raw.flexion
          : raw.flexion + 180,
      ),
      frame?.flexion,
    )!,
    abduction: toClinicalAngle(
      turn(
        axes.twistPlacement === "distal"
          ? raw.abduction + 180
          : 180 - raw.abduction,
      ),
      frame?.abduction,
    )!,
    twist: toClinicalAngle(turn(raw.twist + 180 * handed), frame?.twist)!,
  };
  if (admits(alternate)) return alternate;
  throw new Error(
    "Actual body articulation has no admissible clinical coordinate chart: " +
      reference.bone,
  );
}
