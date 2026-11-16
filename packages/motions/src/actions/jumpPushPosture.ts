import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";
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
 * @returns The raw posture after the ordinary planted-leg lowering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the raw phase, local clock, entry arm rates and lowering stage.
 * @evidence contracts/development/implementation.md#principled-implementation The existing minimum-jerk arm swing and carried entry flexion rates accompany the same push writer and root Hermite; ordinary lowering retains the declared planted knee extension.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamp local time, assemble the shared joints, write both legs and lower once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the push's own root path, never a future flight root or surrogate pose; original goals, entry velocity and acceleration remain intact.
 * @evidence contracts/development/implementation.md#efficient-algorithms One explicit phase sample shares root/progress/carry/yaw/pelvis across arm and leg assembly, followed by the same heel-rule and lowering work; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Arms, the heel's actual hip and the final posture consume the same phase sample. Terminal legs still delegate to the same writer as endpoint preparation; separate local-time queries retain separate samples. The heel's actual hip FK and lowering share one lazy workspace, optionally borrowed from the synchronous parent, without retaining a pose or fitted answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh posture records and retains neither those records nor the optional borrowed reader/supplier, whose lifetime remains the synchronous caller's.
 */
export function jumpPushPosture(props: jumpPush.IProps, paths: jumpPush.IPush, seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IHumanPosture {
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const t: number = Math.min(props.push, Math.max(0, seconds));
  const phase: jumpPush.IPhase = paths.sample(t);
  const root: IAutoMovieVector3 = phase.root;
  const raise: (side: "left" | "right") => number = (side: "left" | "right"): number => {
    const entered: number = props.entry.posture.joints[`${side}UpperArm`]?.[0] ?? 0;
    return entered + (60 - entered) * phase.progress + paths.swinging(side) * phase.carry;
  };
  const joints: IHumanPosture["joints"] = jumpJoints(props.body, props.upright.joints, raise("left"), raise("right"));
  const limbs: IHumanPosture["limbs"] = {};
  paths.write(phase, joints, limbs, read);
  return resolveHumanPosture.lower(props.body, {
    root, yaw: phase.yaw, pitch: 0, roll: 0, joints, limbs,
  }, undefined, read);
}
