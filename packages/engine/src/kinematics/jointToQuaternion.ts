import { IAutoMovieJointPose, IAutoMovieQuaternion } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { normalizeJointAxes } from "./normalizeJointAxes";

const JOINT_AXES = ["flexion", "abduction", "twist"] as const;

const readAngle = (
  joint: Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">,
  axis: (typeof JOINT_AXES)[number],
  frame: IAutoMovieRestFrame[(typeof JOINT_AXES)[number]] | undefined,
): number => {
  const value = joint[axis];
  if (value !== null && !Number.isFinite(value))
    throw new Error(
      `jointToQuaternion ${axis} must be finite or null, but was ${value}`,
    );
  return toRigAngle(value, frame) ?? 0;
};

/**
 * Convert a joint's semantic clinical angles (flexion / abduction / twist) into
 * a single bone-local rotation quaternion.
 *
 * **Axis convention** (bone-local frame, applied in this fixed order): flexion
 * about {@link IAutoMovieJointAxes.flexion} (default local **X**, sagittal),
 * abduction about `abduction` (default **Z**, frontal), twist about `twist`
 * (default **Y**, the bone's long axis). Composition order is twist ∘ abduction
 * ∘ flexion (flexion first in the bone's own frame, then abduction, then axial
 * twist):
 *
 *     q = qTwist * qAbduction * qFlexion;
 *
 * `axes` overrides the default basis per bone so a rig keeps flexion
 * anatomically correct regardless of how its rest frame is oriented (a T-pose
 * arm wants flexion about Y, not its length axis X). Omit it for the default
 * clinical basis, which is consistent and round-trippable.
 *
 * A `null` angle means "no rotation on that axis" and contributes identity.
 *
 * When a `frame` ({@link IAutoMovieRestFrame}) is given, the joint's angles are
 * read as **clinical** and mapped into the rig's rest-relative space first (`r
 * = (clinical − neutral) / sign`, per {@link toRigAngle}), so a pose can be
 * authored in one intuitive clinical convention (e.g. +abduction raises either
 * arm) and the per-side rest frame reconciles it. Omit it for angles already in
 * the rig's own space.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Composes the declared semantic controls in their rig-local basis.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Composes semantic joint controls into the quaternion consumed by forward kinematics.
 * @author Samchon
 */
export const jointToQuaternion = (
  joint: Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">,
  axes: IAutoMovieJointAxes = DEFAULT_JOINT_AXES,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion => {
  const basis = normalizeJointAxes(axes, "jointToQuaternion axes");
  const qFlexion = Quaternion.fromAxisAngle(
    basis.flexion,
    readAngle(joint, "flexion", frame?.flexion),
  );
  const qAbduction = Quaternion.fromAxisAngle(
    basis.abduction,
    readAngle(joint, "abduction", frame?.abduction),
  );
  const qTwist = Quaternion.fromAxisAngle(
    basis.twist,
    readAngle(joint, "twist", frame?.twist),
  );
  return Quaternion.multiply(qTwist, Quaternion.multiply(qAbduction, qFlexion));
};
