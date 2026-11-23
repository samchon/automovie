import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { jumpJoints } from "./jumpJoints";
import type { jumpPush } from "./jumpPush";

/**
 * The lowered raw push posture from the same paths used at release.
 *
 * @param props The completed push inputs and its own root curve.
 * @param paths The prepared push paths.
 * @param seconds Local phase seconds, held at its endpoints.
 * @param resolution Optional exact FK reader or lazy supplier borrowed only for this synchronous phase evaluation.
 * @param prepared Optional fixed-body joint-prefix/lowering writers owned by this same jump plan; omitted calls retain ordinary live joint-table and dimension reads.
 * @returns The raw posture after the ordinary planted-leg lowering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the raw phase, local clock, entry arm rates and lowering stage.
 * @evidence contracts/development/implementation.md#principled-implementation The existing minimum-jerk arm swing and carried entry flexion rates, with the entered elbow's fading gap from the jump's elbow rule, accompany the same push writer and root Hermite; ordinary lowering retains the declared planted knee extension.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamp local time, apply the two prepared entry-arm tracks to this same phase sample, assemble joints, write both legs and lower once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the push's own root path, never a future flight root or surrogate pose; original goals, entry velocity and acceleration remain intact.
 * @evidence contracts/development/implementation.md#efficient-algorithms One explicit phase sample shares root/progress/carry/yaw/pelvis across arm and leg assembly. Optional fixed-body writers prepare the joint prefix and cosine-law reach once; every current heel rule, plant collection, hip FK and lowering square root/comparison remains. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Arms, the heel's actual hip and the final posture consume the same phase sample. Explicit fixed writers share only unchanged relaxed/upright entries, arm separation and the body's minimum-knee reach; omission retains original live table/dimension reads. Terminal legs still share the endpoint writer. The heel's actual hip FK and lowering borrow one synchronous lazy workspace without retaining a pose, goal or fitted answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh posture records and retains neither those records nor the optional borrowed reader/supplier, whose lifetime remains the synchronous caller's.
 */
export function jumpPushPosture(props: jumpPush.IProps, paths: jumpPush.IPush, seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], prepared?: IPrepared): IAutoMovieMotionHumanPosture {
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const t: number = Math.min(props.push, Math.max(0, seconds));
  const phase: jumpPush.IPhase = paths.sample(t);
  const root: IAutoMovieVector3 = phase.root;
  const left: number = paths.arm(phase, "left");
  const right: number = paths.arm(phase, "right");
  const joints: IAutoMovieMotionHumanPosture["joints"] = prepared === undefined
    ? jumpJoints(props.body, props.upright.joints, left, right)
    : prepared.joints(left, right);
  // The entered elbow's gap from the rule fades with the push (`IPush.elbow`).
  for (const side of ["left", "right"] as const) {
    const gap: number = paths.elbow(phase, side);
    const lower: readonly [number, number, number] | undefined = joints[`${side}LowerArm`];
    if (gap !== 0 && lower !== undefined)
      joints[`${side}LowerArm`] = [lower[0] + gap, lower[1], lower[2]];
  }
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  paths.write(phase, joints, limbs, read);
  const posture: IAutoMovieMotionHumanPosture = {
    root, yaw: phase.yaw, pitch: 0, roll: 0, joints, limbs,
  };
  return prepared === undefined
    ? resolveHumanPosture.lower(props.body, posture, undefined, read)
    : prepared.lower(posture, read);
}

/** Two unchanged-body prerequisites owned by the actual jump plan, never query poses or borrowed workspaces. */
interface IPrepared {
  /** Original relaxed/upright prefix and arm separation; every sample still owns its table/arm tuples. */
  joints: ReturnType<typeof jumpJoints.prepare>;
  /** Original minimum-knee reach; every actual plant, hip and lowering remains current. */
  lower: ReturnType<typeof lowerHumanPosture.prepare>;
}
