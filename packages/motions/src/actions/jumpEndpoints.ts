import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { jumpGroundPosture } from "./jumpGroundPosture";
import { jumpJoints } from "./jumpJoints";
import { jumpPushEnd } from "./jumpPushEnd";
import { jumpState } from "./jumpState";

/**
 * One preparation of the achieved endpoints shared by flight goals and COM.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes unlowered phase roots, authored plants and finalized endpoint states.
 * @evidence contracts/development/design.md#principled-representation Start and end are canonical states of the existing planted phase demands, not separately reconstructed airborne foot poses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One pair and one constructor keep endpoint values independent of the push's timed entry curves and ballistic velocities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses each phase's actual targets and existing lowering/resolution owners; no provisional fixed flight ankle or alternate support is substituted.
 */
export namespace jumpEndpoints {
  /**
   * Achieved terminal push and touchdown states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both fields hold canonical endpoint poses and root-local leg geometry.
   * @evidence contracts/development/design.md#principled-representation A pair of states supplies both the mass boundary and the free shape boundary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the start and end states are returned.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses jumpState rather than another pose or FK representation.
   */
  export interface IEnds {
    /** Achieved push end after lowering and physical fitting. */
    start: jumpState.IState;
    /** Achieved first planted landing pose. */
    end: jumpState.IState;
  }

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States phase/root provenance, original footprints and preparation order.
   * @evidence contracts/development/implementation.md#principled-implementation Both endpoints lower for their actual supports. Push-off fits the reaching ankle and landing clears the arms against the resulting thighs through jumpGroundPosture, as playback does, before solving the canonical mass boundaries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the terminal push, prepare both landing goals, then return their normalized states.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never feeds the lowered root back into the raw push rule; this keeps lowering single and avoids the launch/root planning cycle. Original floor/prop footprints and support checks stay unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation evaluates each endpoint once. It shares the fixed-body minimum-knee reach and FK reader through the support and reaching ankle rockers, landing arm clearance, and both canonical endpoint reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ballistic COM and free goals consume the same actual endpoints. One synchronous FK workspace, genuine projector and fixed-body reach producer supply terminal geometry, actual endpoint lowerings/solves/final clamps, planted refits and local observations; only unchanged reach/prerequisites/static ROM metadata share work while every current joint/dependency still evaluates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two plan-owned states; temporary goals, the four-bone leg reader, fixed reach reader, FK getter/workspace and ROM projector release on return or throw. No workspace, lowering callback or query history enters the returned records.
   */
  export function of(
    props: Parameters<typeof jumpPushEnd>[0],
    rootT: IAutoMovieVector3,
    rootL: IAutoMovieVector3,
    landing: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    landingHeading: number,
    landingKnee: typeof props.knee,
  ): IEnds {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(props.body);
    const lower: ReturnType<typeof lowerHumanPosture.prepare> =
      lowerHumanPosture.prepare(props.body);
    const legs: ReturnType<typeof jumpState.prepareLegs> =
      jumpState.prepareLegs(props.body);
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
    const start: jumpState.IState = jumpState.of(
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
        bend: landingKnee(
          rootL,
          side,
          HumanFoot.heading(landing[side].rotation),
        ),
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
    const end: jumpState.IState = jumpState.of(
      props.body,
      jumpGroundPosture(props.body, landed, "landing", read),
      legs,
      read,
      projection,
    );
    return { start, end };
  }
}
