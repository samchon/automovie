import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { crawlChain } from "./crawlChain";
import { crawlFrame } from "./crawlFrame";
import type { lieDown } from "./lieDown";

/**
 * The inchworm's posture at a placement of its hands and feet, by its
 * middle-plane chain (`crawlChain`): the stated posture each stance of the
 * walk is solved from and kept nearest (`HumanSupport.IStance.prefer`), so
 * the whole-body fit starts at the chain's own shape instead of the
 * standing it would otherwise climb down from, where its l1 merit can stop
 * at a stationary point of the violation that meets no contact (Nocedal and
 * Wright 2006, chapter 17).
 *
 * The body pitches as the chain's trunk lies, each foot pivoted on its ball
 * with the heel lifted as the chain lifts it and the knee bent toward the
 * front of the leg by `KNEE` of the shank (provisional), each palm laid flat
 * on the floor at its place; the posture is then resolved to joint angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the posture is, why the fit starts there with its source, how it is built and the provisional value.
 * @evidence contracts/development/design.md#principled-representation A stance's stated posture computed from the chain's shape, never typed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knee's hint and one builder, read by the inchworm.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is the chain's and the body's; the arms and legs are the shared limb goals.
 */
export namespace crawlInchwormPose {
  /** How far the knee's bend point lies before the straight leg's middle, as a share of the shank (provisional). */
  export const KNEE: number = 0.25;

  /**
   * The posture at a placement.
   *
   * @param body The body.
   * @param chain The chain built for the body's standing.
   * @param frame The floor frame of the heading.
   * @param feet Each foot's ball along the heading, metres in the frame.
   * @param wrists Each wrist along the heading, metres in the frame.
   * @returns The whole body's tilt and its joint angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their frame and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The chain's shape at the feet's and wrists' middles places the hips and the trunk's pitch; the limb goals place the feet on their balls and the palms on the floor; the resolved pose gives the joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shape, one posture with four limb goals, one resolve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the fit then meets the stance's contacts exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain shape and one posture resolve per stance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the chain, the crawl's frame and root, the foot pivot, the palm target and the arm goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    body: IHumanBody,
    chain: crawlChain.IChain,
    frame: HumanFrame.IFrame,
    feet: Record<"left" | "right", number>,
    wrists: Record<"left" | "right", number>,
    laid: ReturnType<typeof crawlFrame.prepareLaid> = crawlFrame.prepareLaid(body, HumanFrame.forward(frame.yaw)),
  ): lieDown.IPose {
    const DEG: number = 180 / Math.PI;
    const sides = ["left", "right"] as const;
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
    const target: IHumanPosture = crawlFrame.posed(
      body,
      frame.yaw,
      1,
      pitch,
      0,
      0,
    );
    const posture: IHumanPosture = {
      ...target,
      root: crawlFrame.rootFor(
        body,
        target,
        HumanFrame.point(frame, { x: 0, y: shape.hips.v, z: shape.hips.u }),
      ),
      limbs: {},
      joints: { ...target.joints },
    };
    const knee: number = KNEE * body.measure.shank;
    for (const side of sides) {
      const placement: HumanFoot.IPlacement = HumanFoot.pivot(
        body,
        side,
        "mtp",
        HumanFrame.point(frame, {
          x: chain.balls[side].x,
          y: chain.balls[side].y,
          z: feet[side],
        }),
        frame.yaw,
        -shape.heel,
      );
      posture.limbs[`${side}Leg`] = {
        point: placement.ankle,
        rotation: placement.rotation,
        bend: HumanFrame.point(frame, {
          x: chain.balls[side].x,
          y:
            (shape.hips.v + shape.ankle.v) / 2 -
            knee * Math.cos(shape.lam / DEG),
          z:
            (shape.hips.u + shape.ankle.u) / 2 +
            knee * Math.sin(shape.lam / DEG),
        }),
        contact: HumanFoot.offset(body, side, "mtp"),
      };
      posture.joints[`${side}Toes`] = [shape.heel, 0, 0];
    }
    const placed: IHumanPosture = laid(posture, (side: "left" | "right"): IAutoMovieVector3 => HumanFrame.point(frame, { x: chain.palms[side], y: 0, z: wrists[side] - chain.wrists[side].z }));
    const joints: lieDown.IPose["joints"] = {};
    for (const j of resolveHumanPosture(body, placed).joints)
      joints[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    return { pitch: posture.pitch, roll: 0, joints };
  }
}
