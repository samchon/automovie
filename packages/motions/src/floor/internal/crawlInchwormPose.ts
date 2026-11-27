import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { crawlChain } from "./crawlChain";
import { crawlFrame } from "./crawlFrame";

/**
 * The posture at a placement.
 *
 * @param body The body.
 * @param chain The chain built for the body's standing.
 * @param frame The floor frame of the heading.
 * @param feet Each foot's ball along the heading, metres in the frame.
 * @param wrists Each wrist along the heading, metres in the frame.
 * @param laid Fixed palm geometry from this unchanged body/frame, or the same
 *   native preparation when omitted; current FK is borrowed only during this
 *   placement.
 * @param source Optional exact FK source belonging only to this synchronous
 *   preference construction.
 * @param projector Optional genuine ROM metadata from that same construction;
 *   every current joint remains projected.
 * @returns The whole body's tilt and its joint angles.
 */
export function crawlInchwormPose(
  body: IAutoMovieMotionHumanBody,
  chain: crawlChain.IChain,
  frame: IAutoMovieMotionHumanFrame,
  feet: Record<AutoMovieHumanSide, number>,
  wrists: Record<AutoMovieHumanSide, number>,
  laid: ReturnType<typeof crawlFrame.prepareLaid> = crawlFrame.prepareLaid(
    body,
    HumanFrame.forward(frame.yaw),
  ),
  source?: Parameters<typeof prepareHumanPoseResolution>[0],
  projector?: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMovieMotionHumanLieDown.IPose {
  return crawlInchwormPose.prepare(body, chain, frame, laid)(
    feet,
    wrists,
    source,
    projector,
  );
}

/**
 * The inchworm's posture at a placement of its hands and feet, by its
 * middle-plane chain (`crawlChain`): the stated posture each stance of the walk
 * is solved from and kept nearest (`HumanSupport.IStance.prefer`), so the
 * whole-body fit starts at the chain's own shape instead of the standing it
 * would otherwise climb down from, where its l1 merit can stop at a stationary
 * point of the violation that meets no contact (Nocedal and Wright 2006,
 * chapter 17).
 *
 * The body pitches as the chain's trunk lies, each foot pivoted on its ball
 * with the heel lifted as the chain lifts it and the knee bent toward the front
 * of the leg by `KNEE` of the shank (provisional), each palm laid flat on the
 * floor at its place; the posture is then resolved to joint angles.
 */
export namespace crawlInchwormPose {
  /**
   * How far the knee's bend point lies before the straight leg's middle, as a
   * share of the shank (provisional).
   */
  export const KNEE: number = 0.25;

  /**
   * Prepare unchanged body/chain/floor geometry for the inchworm's stance
   * preferences. Each placement still builds four actual limb goals and
   * resolves the complete posture; only frame and sole prerequisites share.
   *
   * @param body The unchanged body and its foot/hand geometry.
   * @param chain The fixed standing-source planar chain.
   * @param frame Fixed world-metre floor origin and degree heading.
   * @param laid The existing fixed palm reader, or its original preparation
   *   when absent.
   * @returns A fresh clinical-posture builder for current local-metre
   *   foot-ball/wrist coordinates, borrowing optional FK/ROM inputs only during
   *   each actual synchronous call.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    chain: crawlChain.IChain,
    frame: IAutoMovieMotionHumanFrame,
    laid: ReturnType<typeof crawlFrame.prepareLaid> = crawlFrame.prepareLaid(
      body,
      HumanFrame.forward(frame.yaw),
    ),
  ): (
    feet: Record<AutoMovieHumanSide, number>,
    wrists: Record<AutoMovieHumanSide, number>,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projector?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanLieDown.IPose {
    const DEG: number = 180 / Math.PI;
    const sides: readonly ["left", "right"] = ["left", "right"];
    const yaw: number = frame.yaw;
    const floor: ReturnType<typeof HumanFrame.prepare> =
      HumanFrame.prepare(frame);
    const knee: number = KNEE * body.measure.shank;
    const pivots: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFoot.preparePivot>
    > = {
      left: HumanFoot.preparePivot(
        body,
        "left",
        "mtp",
        { x: 0, y: 0, z: 0 },
        yaw,
      ),
      right: HumanFoot.preparePivot(
        body,
        "right",
        "mtp",
        { x: 0, y: 0, z: 0 },
        yaw,
      ),
    };
    const contacts: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: { ...HumanFoot.offset(body, "left", "mtp") },
      right: { ...HumanFoot.offset(body, "right", "mtp") },
    };
    return (
      feet: Record<AutoMovieHumanSide, number>,
      wrists: Record<AutoMovieHumanSide, number>,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      projector?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanLieDown.IPose => {
      const shape: crawlChain.IShape = chain.shape(
        (feet.left + feet.right) / 2,
        (wrists.left + wrists.right) / 2,
      );
      const pitch: number =
        Math.atan2(
          shape.shoulders.u - shape.hips.u,
          shape.shoulders.v - shape.hips.v,
        ) *
          DEG -
        chain.lean;
      const target: IAutoMovieMotionHumanPosture = crawlFrame.posed(
        body,
        yaw,
        1,
        pitch,
        0,
        0,
      );
      const posture: IAutoMovieMotionHumanPosture = {
        ...target,
        root: crawlFrame.rootFor(
          body,
          target,
          floor.point({ x: 0, y: shape.hips.v, z: shape.hips.u }),
        ),
        limbs: {},
        joints: { ...target.joints },
      };
      const kneeY: number =
        (shape.hips.v + shape.ankle.v) / 2 - knee * Math.cos(shape.lam / DEG);
      const kneeZ: number =
        (shape.hips.u + shape.ankle.u) / 2 + knee * Math.sin(shape.lam / DEG);
      for (const side of sides) {
        const placement: IAutoMovieMotionHumanFoot.IPlacement = pivots[side](
          -shape.heel,
          floor.point({
            x: chain.balls[side].x,
            y: chain.balls[side].y,
            z: feet[side],
          }),
        );
        posture.limbs[`${side}Leg`] = {
          point: placement.ankle,
          rotation: placement.rotation,
          bend: floor.point({
            x: chain.balls[side].x,
            y: kneeY,
            z: kneeZ,
          }),
          contact: { ...contacts[side] },
        };
        posture.joints[`${side}Toes`] = [shape.heel, 0, 0];
      }
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        projector ?? prepareHumanPostureProjection(body);
      const placed: IAutoMovieMotionHumanPosture = laid(
        posture,
        (side: AutoMovieHumanSide): IAutoMovieVector3 =>
          floor.point({
            x: chain.palms[side],
            y: 0,
            z: wrists[side] - chain.wrists[side].z,
          }),
        resolution,
      );
      const joints: IAutoMovieMotionHumanLieDown.IPose["joints"] = {};
      for (const j of resolveHumanPosture.seeded(
        body,
        placed,
        undefined,
        undefined,
        resolution,
        undefined,
        projection,
      ).pose.joints)
        joints[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
      return { pitch: posture.pitch, roll: 0, joints };
    };
  }
}
