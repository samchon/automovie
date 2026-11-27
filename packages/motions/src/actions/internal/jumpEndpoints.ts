import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { jumpGroundPosture } from "./jumpGroundPosture";
import { jumpJoints } from "./jumpJoints";
import { jumpPushEnd } from "./jumpPushEnd";
import { jumpState } from "./jumpState";

/**
 * Resolve phase values before solving flight time and launch velocity.
 *
 * @param props The shared pure terminal push geometry.
 * @param rootT The unlowered terminal push root, world metres.
 * @param rootL The unlowered touchdown root, world metres.
 * @param landing The original authored flat landing footprints.
 * @param landingHeading The flat landing's world heading in degrees.
 * @param landingKnee The authored pole in the landing frame.
 * @returns The two achieved canonical boundary states.
 */
export function jumpEndpoints(
  props: Parameters<typeof jumpPushEnd>[0],
  rootT: IAutoMovieVector3,
  rootL: IAutoMovieVector3,
  landing: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  landingHeading: number,
  landingKnee: typeof props.knee,
): jumpEndpoints.IEnds {
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(props.body);
  const lower: ReturnType<typeof lowerHumanPosture.prepare> =
    lowerHumanPosture.prepare(props.body);
  const legs: ReturnType<typeof jumpState.prepareLegs> = jumpState.prepareLegs(
    props.body,
  );
  const terminal: ReturnType<typeof jumpPushEnd> = jumpPushEnd(
    props,
    rootT,
    read,
  );
  const pushed: IAutoMovieMotionHumanPosture = lower(
    {
      root: rootT,
      yaw: props.heading,
      pitch: 0,
      roll: 0,
      joints: {
        ...jumpJoints(
          props.body,
          props.upright.joints,
          jumpJoints.TAKEOFF,
          jumpJoints.TAKEOFF,
        ),
        ...terminal.joints,
      },
      limbs: terminal.limbs,
    },
    read,
  );
  const start: jumpState.IState = jumpState(
    props.body,
    jumpGroundPosture(props.body, pushed, props.reaching, read),
    legs,
    read,
    projection,
  );
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const side of ["left", "right"] as const)
    limbs[`${side}Leg`] = {
      point: landing[side].ankle,
      rotation: landing[side].rotation,
      bend: landingKnee(rootL, side, HumanFoot.heading(landing[side].rotation)),
      planted: true,
      contact: HumanFoot.offset(props.body, side, "mtp"),
    };
  const landed: IAutoMovieMotionHumanPosture = lower(
    {
      root: rootL,
      yaw: landingHeading,
      pitch: 0,
      roll: 0,
      joints: jumpJoints(
        props.body,
        props.upright.joints,
        jumpJoints.LANDING,
        jumpJoints.LANDING,
      ),
      limbs,
    },
    read,
  );
  const end: jumpState.IState = jumpState(
    props.body,
    jumpGroundPosture(props.body, landed, "landing", read),
    legs,
    read,
    projection,
  );
  return { start, end };
}

/** One preparation of the achieved endpoints shared by flight goals and COM. */
export namespace jumpEndpoints {
  /** Achieved terminal push and touchdown states. */
  export interface IEnds {
    /** Achieved push end after lowering and physical fitting. */
    start: jumpState.IState;
    /** Achieved first planted landing pose. */
    end: jumpState.IState;
  }
}
