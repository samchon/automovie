import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { jumpPush } from "./jumpPush";
import { walkLeg } from "./walkLeg";

/** The alternatives of `JumpPushEndResult`'s site. */
type JumpPushEndResult = "joints" | "limbs";

/** The alternatives of `JumpPushEndProps`'s site. */
type JumpPushEndProps =
  | "body"
  | "takeoff"
  | "reaching"
  | "supportPitch"
  | "supportHeading"
  | "ball"
  | "upright"
  | "heading"
  | "tuck"
  | "knee";

/**
 * The raw end of the planted push, shared with the airborne initial state. All
 * carried entry rates vanish here; the heel rule still reads the actual
 * terminal hip, so its pitch is not replaced by the provisional request.
 *
 * @param props The push's body, geometry and knee rule, without its timed root
 *   path.
 * @param root The unlowered terminal root, world metres.
 * @param resolution Optional exact FK source borrowed only for this synchronous
 *   terminal hip read.
 * @returns The terminal pelvis/toes and leg goals; the caller still owns
 *   lowering and physical resolution.
 */
export function jumpPushEnd(
  props: Pick<jumpPush.IProps, JumpPushEndProps>,
  root: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): Pick<IAutoMovieMotionHumanPosture, JumpPushEndResult> {
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(resolution);
  const hip: IAutoMovieVector3 = hipJoints(
    props.body,
    root,
    humanPostureHeading({ yaw: props.heading, pitch: 0, roll: 0 }),
    props.upright.joints.hips,
    read(),
  )[props.takeoff];
  // The push writer's own rule at its end, read at the hip the planted leg
  // stands from (`jumpPush.standing`), so the end meets the push it ends.
  const asked: number = Math.min(props.supportPitch, 0, -jumpPush.HEEL);
  const stood: IAutoMovieVector3 | undefined = jumpPush.standing(
    hip,
    HumanFoot.pivot(
      props.body,
      props.takeoff,
      "mtp",
      props.ball,
      props.supportHeading,
      asked,
    ).ankle,
    lowerHumanPosture.prepareShort(props.body, lowerHumanPosture.KNEE),
  );
  const pitch: number =
    stood === undefined
      ? asked
      : walkLeg.heelRise(
          props.body,
          props.takeoff,
          stood,
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
        point: HumanFrame.point(
          { origin: root, yaw: props.heading },
          props.tuck,
        ),
        rotation: HumanFoot.rotation(props.heading, 0),
        bend: props.knee(root, props.reaching, props.heading),
      },
    },
  };
}
