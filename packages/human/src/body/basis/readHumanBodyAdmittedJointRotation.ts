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
 * The engine owns the principal inverse. Its orthonormal [flex, abduction, handed twist] basis makes proximal order Rz(t) Ry(a) Rx(f), whose second chart is (f+180, 180-a, t+180), and distal order Ry(a) Rx(f) Rz(t), whose second chart is (180-f, a+180, t+180). The handed twist sign is restored before the existing rest-frame lift converts rig degrees to clinical ones. Each angle is reduced by full turns, never clamped to a motion limit.
 *
 * An authored reference is retained only when it reconstructs the actual quaternion and passes the same pose admission. Otherwise the principal and alternate charts are checked in that order. This preserves a permitted elbow flexion past 90 degrees without presenting its equivalent 180-degree held-axis rotation as a physiological motion. No admitted equivalent chart means refusal. Quaternion agreement uses a 1e-12 component arithmetic tolerance, not a clinical angular uncertainty or a registration claim.
 *
 * @evidence contracts/common.md#principled-implementation The shared engine inverse supplies principal and alternate proximal/distal charts; a candidate must reconstruct the actual normalized articulation up to quaternion sign and pass the same clinical pose admission.
 * @evidence contracts/common.md#clear-and-simple-design Authored coordinates are tried first, then principal and alternate charts, with one shared forward/admission predicate and full-turn reduction rather than range clamping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No admitted equivalent chart refuses; the 1e-12 quaternion component policy is numerical identity, not angular uncertainty, physiological evidence or a replacement rotation.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies chart order, handed twist, rest-to-clinical lift, degree turns, exact authored retention and the reconstruction/admission refusal.
 * @evidence contracts/performance.md#efficient-algorithms At most three candidate charts perform fixed quaternion arithmetic and shared pose validation; source skeleton admission cost belongs to validatePose rather than an iterative chart search.
 * @evidence contracts/performance.md#reuse-equivalent-work Engine normalization, forward/inverse articulation and clinical conversion are reused; one normalized actual quaternion and axes record serve all candidate checks in the call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one admitted angle record escapes; temporary chart/quaternion and validation records expire after return or refusal, without retained geometry, caches or external work.
 */
export function readHumanBodyAdmittedJointRotation(
  rig: IAutoMovieHumanBodySkeletonRig,
  reference: IAutoMovieJointPose,
  rotation: IAutoMovieQuaternion,
): IAutoMovieResolvedJointAngles {
  const axes: ReturnType<typeof normalizeJointAxes> = normalizeJointAxes(
    rig.axes[reference.bone] ?? DEFAULT_JOINT_AXES,
    "body actual joint coordinates",
  );
  const frame: typeof rig.frames[typeof reference.bone] = rig.frames[reference.bone];
  const actual: IAutoMovieQuaternion = Quaternion.normalize(rotation);
  const admits: (candidate: IAutoMovieResolvedJointAngles) => boolean = (candidate: IAutoMovieResolvedJointAngles): boolean => {
    const forward: IAutoMovieQuaternion = jointToQuaternion(candidate, axes, frame);
    const sign: number =
      forward.x * actual.x +
        forward.y * actual.y +
        forward.z * actual.z +
        forward.w * actual.w <
      0
        ? -1
        : 1;
    const error: number = Math.max(
      ...(["x", "y", "z", "w"] as const).map((axis: "x" | "y" | "z" | "w"): number =>
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
  const principal: IAutoMovieResolvedJointAngles = decomposeJointRotation(rotation, axes, frame);
  if (admits(principal)) return principal;
  const raw: IAutoMovieResolvedJointAngles = decomposeJointRotation(rotation, axes);
  const handed: number =
    Vector3.dot(axes.twist, Vector3.cross(axes.flexion, axes.abduction)) >= 0
      ? 1
      : -1;
  const turn: (degrees: number) => number = (degrees: number): number =>
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
