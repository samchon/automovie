import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { jumpPush } from "./jumpPush";
import { walkLeg } from "./walkLeg";

/**
 * The raw end of the planted push, shared with the airborne initial state.
 * All carried entry rates vanish here; the heel rule still reads the actual
 * terminal hip, so its pitch is not replaced by the provisional request.
 *
 * @param props The push's body, geometry and knee rule, without its timed root path.
 * @param root The unlowered terminal root, world metres.
 * @param resolution Optional exact FK source borrowed only for this synchronous terminal hip read.
 * @returns The terminal pelvis/toes and leg goals; the caller still owns lowering and physical resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the raw root and goals from subsequent lowering and canonical resolution, and states why carried entry terms are absent.
 * @evidence contracts/development/implementation.md#principled-implementation Evaluates jumpPush's terminal conditions: upright pelvis and heading, the push writer's pitch rule asked min(entry pitch, 0, -jumpPush.HEEL) (the asked pitch where the hip is beyond the leg's reach of the ball, else walkLeg.heelRise), the same metatarsal pivot and knee pole, and the reaching ankle at its body-frame tuck with a flat foot.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the terminal hip and heel rule, construct the actual support placement, then return the same two goals used by the push writer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the actual ruled pitch, toes, support heading and plant/contact. No fake trajectory, epsilon, fixed flight angle or alternate range replaces the body rule.
 * @evidence contracts/development/implementation.md#efficient-algorithms One ordinary heel-rule evaluation plus fixed-size frame operations per terminal read; the timed push retains its existing entry-rate calculations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both the raw push writer and flight endpoint preparation consume this same terminal producer; heelRise, hipJoints and HumanFoot keep their algorithm ownership. The optional synchronous source shares only exact hip FK dependencies with the caller's actual lowering/resolution.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records/vectors with borrowed immutable body geometry; neither its local lazy getter nor an optionally borrowed exact FK source enters the returned goals or retained plan.
 */
export function jumpPushEnd(
  props: Pick<
    jumpPush.IProps,
    | "body"
    | "takeoff"
    | "reaching"
    | "supportPitch"
    | "supportHeading"
    | "ball"
    | "upright"
    | "heading"
    | "tuck"
    | "knee"
  >,
  root: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): Pick<IAutoMovieMotionHumanPosture, "joints" | "limbs"> {
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const hip: IAutoMovieVector3 = hipJoints(
    props.body,
    root,
    resolveHumanPosture.heading({ yaw: props.heading, pitch: 0, roll: 0 }),
    props.upright.joints.hips,
    read(),
  )[props.takeoff];
  // The push writer's own rule at its end: where the hip is farther from
  // the ball than the leg reaches, the leg's lean has no value and the asked
  // pitch stands, so the end meets the push it ends.
  const asked: number = Math.min(props.supportPitch, 0, -jumpPush.HEEL);
  const pitch: number =
    Vector3.distance(hip, props.ball) >
    props.body.measure.thigh + props.body.measure.shank
      ? asked
      : walkLeg.heelRise(
          props.body,
          props.takeoff,
          hip,
          props.ball,
          props.supportHeading,
          asked,
          walkLeg.ROCKER,
        );
  const foot: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
    props.body,
    props.takeoff,
    "mtp",
    props.ball,
    props.supportHeading,
    pitch,
  );
  return {
    joints: {
      hips: props.upright.joints.hips ?? [0, 0, 0],
      [`${props.takeoff}Toes`]: [-pitch, 0, 0],
    },
    limbs: {
      [`${props.takeoff}Leg`]: {
        point: foot.ankle,
        rotation: foot.rotation,
        bend: props.knee(root, props.takeoff, props.supportHeading),
        planted: true,
        contact: HumanFoot.offset(props.body, props.takeoff, "mtp"),
      },
      [`${props.reaching}Leg`]: {
        point: HumanFrame.point({ origin: root, yaw: props.heading }, props.tuck),
        rotation: HumanFoot.rotation(props.heading, 0),
        bend: props.knee(root, props.reaching, props.heading),
      },
    },
  };
}
