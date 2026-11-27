import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { jumpJoints } from "./jumpJoints";
import type { jumpPush } from "./jumpPush";

/**
 * The lowered raw push posture from the same paths used at release.
 *
 * @param props The completed push inputs and its own root curve.
 * @param paths The prepared push paths.
 * @param seconds Local phase seconds, held at its endpoints.
 * @param resolution Optional exact FK reader or lazy supplier borrowed only for
 *   this synchronous phase evaluation.
 * @param prepared Optional fixed-body joint-prefix/lowering writers owned by
 *   this same jump plan; omitted calls retain ordinary live joint-table and
 *   dimension reads.
 * @returns The raw posture after the ordinary planted-leg lowering.
 */
export function jumpPushPosture(
  props: jumpPush.IProps,
  paths: jumpPush.IPush,
  seconds: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  prepared?: IPrepared,
): IAutoMovieMotionHumanPosture {
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(resolution);
  const t: number = Math.min(props.push, Math.max(0, seconds));
  const phase: jumpPush.IPhase = paths.sample(t);
  const root: IAutoMovieVector3 = phase.root;
  const left: number = paths.arm(phase, "left");
  const right: number = paths.arm(phase, "right");
  const joints: IAutoMovieMotionHumanPosture["joints"] =
    prepared === undefined
      ? jumpJoints(props.body, props.upright.joints, left, right)
      : prepared.joints(left, right);
  // The entered elbow's gap from the rule fades with the push (`IPush.elbow`).
  for (const side of ["left", "right"] as const) {
    const gap: number = paths.elbow(phase, side);
    const lower: readonly [number, number, number] | undefined =
      joints[`${side}LowerArm`];
    if (gap !== 0 && lower !== undefined)
      joints[`${side}LowerArm`] = [lower[0] + gap, lower[1], lower[2]];
  }
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  paths.write(phase, joints, limbs, read);
  const posture: IAutoMovieMotionHumanPosture = {
    root,
    yaw: phase.yaw,
    pitch: 0,
    roll: 0,
    joints,
    limbs,
  };
  return prepared === undefined
    ? lowerHumanPosture(props.body, posture, undefined, read)
    : prepared.lower(posture, read);
}

/**
 * Two unchanged-body prerequisites owned by the actual jump plan, never query
 * poses or borrowed workspaces.
 */
interface IPrepared {
  /**
   * Original relaxed/upright prefix and arm separation; every sample still owns
   * its table/arm tuples.
   */
  joints: ReturnType<typeof jumpJoints.prepare>;
  /**
   * Original minimum-knee reach; every actual plant, hip and lowering remains
   * current.
   */
  lower: ReturnType<typeof lowerHumanPosture.prepare>;
}
