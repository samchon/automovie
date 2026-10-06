import {
  DEFAULT_JOINT_AXES, Quaternion, Vector3, decomposeJointRotation,
  jointToQuaternion, normalizeJointAxes, toClinicalAngle, validatePose,
  type IAutoMovieResolvedJointAngles,
} from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMovieQuaternion } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Uses the existing inverse, forward conversion and pose admission together; a coordinate is returned only when it represents the actual orientation inside the declared joint domain.
 * @evidence contracts/common.md#clear-and-simple-design Checks the actual authored chart, principal chart and one order-specific alternate chart without searching a new motion model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone-name exception, range reduction or caller-value clamping selects a chart; absent admissible equivalents refuse.
 * @evidence contracts/common.md#meaningful-documentation Gives the two rotation orders, equivalent-chart equations, handedness, frame lift and arithmetic limits.
 * @evidence contracts/modeling.md#spatial-conventions The articulation is a unit quaternion in bone-local rig axes. Equivalent rig degrees are lifted through the existing sign/neutral frame into clinical degrees.
 * @evidence contracts/modeling.md#parameter-channels Preserves the existing flexion, abduction and twist meanings and nullable-axis policy rather than introducing another motion input.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads a rig coordinate and defines no geometry part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no surface or volume boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The source assembly owns observation of its performed geometry; this helper selects numerical coordinates.
 * @evidence contracts/anatomy.md#anatomical-source The clinical labels and bounds retain the supplied source rig's qualification; equivalent quaternion charts establish no measured personal capacity.
 * @evidence contracts/anatomy.md#permitted-range Each candidate passes existing validatePose, including held axes and coupled swing bounds. A candidate outside the source domain or unlike the actual rotation is discarded without changing the request.
 * @evidence contracts/anatomy.md#parametric-authority The helper reports existing named motions from their actual performed rotation, without public vertex, matrix or anatomical sculpt inputs.
 */
export function readHumanBodyAdmittedJointRotation(
  rig: IAutoMovieHumanBodySkeletonRig,
  reference: IAutoMovieJointPose,
  rotation: IAutoMovieQuaternion,
): IAutoMovieResolvedJointAngles {
  const axes = normalizeJointAxes(rig.axes[reference.bone] ?? DEFAULT_JOINT_AXES, "body actual joint coordinates");
  const frame = rig.frames[reference.bone];
  const actual = Quaternion.normalize(rotation);
  const admits = (candidate: IAutoMovieResolvedJointAngles): boolean => {
    const forward = jointToQuaternion(candidate, axes, frame);
    const sign = forward.x * actual.x + forward.y * actual.y + forward.z * actual.z + forward.w * actual.w < 0 ? -1 : 1;
    const error = Math.max(...(["x", "y", "z", "w"] as const).map((axis) => Math.abs(forward[axis] * sign - actual[axis])));
    return error <= 1e-12 && validatePose({
      skeleton: rig.skeleton,
      pose: { skeleton: rig.skeleton.id, root: null, joints: [{ bone: reference.bone, ...candidate }] },
    }).items.length === 0;
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
  const handed = Vector3.dot(axes.twist, Vector3.cross(axes.flexion, axes.abduction)) >= 0 ? 1 : -1;
  const turn = (degrees: number): number => ((degrees + 180) % 360 + 360) % 360 - 180;
  const alternate: IAutoMovieResolvedJointAngles = {
    flexion: toClinicalAngle(turn(axes.twistPlacement === "distal" ? 180 - raw.flexion : raw.flexion + 180), frame?.flexion)!,
    abduction: toClinicalAngle(turn(axes.twistPlacement === "distal" ? raw.abduction + 180 : 180 - raw.abduction), frame?.abduction)!,
    twist: toClinicalAngle(turn(raw.twist + 180 * handed), frame?.twist)!,
  };
  if (admits(alternate)) return alternate;
  throw new Error("Actual body articulation has no admissible clinical coordinate chart: " + reference.bone);
}
