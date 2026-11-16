import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
   * @returns The two achieved canonical boundary states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States phase/root provenance, original footprints and preparation order.
   * @evidence contracts/development/implementation.md#principled-implementation The shared jumpPushEnd produces takeoff values; the landing uses the original feet and each footprint's knee heading. Both apply the existing planted-leg lowering and same actual canonical endpoint reader before COM is solved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the terminal push, prepare both landing goals, then return their normalized states.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never feeds the lowered root back into the raw push rule; this keeps lowering single and avoids the launch/root planning cycle. Original floor/prop footprints and support checks stay unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One shared heel-rule read and two existing endpoint canonical resolutions/FK preparations per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ballistic COM and airborne goals consume these same actual poses and leg records; neither independently reconstructs their endpoints.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two plan-owned state records; temporary authored goal tables release after preparation with no global cache.
   */
  export function of(
    props: Parameters<typeof jumpPushEnd>[0],
    rootT: IAutoMovieVector3,
    rootL: IAutoMovieVector3,
    landing: Record<"left" | "right", HumanFoot.IPlacement>,
  ): IEnds {
    const terminal: ReturnType<typeof jumpPushEnd> = jumpPushEnd(props, rootT);
    const start: jumpState.IState = jumpState.of(props.body, resolveHumanPosture.lower(props.body, {
      root: rootT, yaw: props.heading, pitch: 0, roll: 0,
      joints: { ...jumpJoints(props.body, props.upright.joints, 60, 60), ...terminal.joints },
      limbs: terminal.limbs,
    }));
    const limbs: IHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const)
      limbs[`${side}Leg`] = {
        point: landing[side].ankle,
        rotation: landing[side].rotation,
        bend: props.knee(rootL, side, HumanFoot.heading(landing[side].rotation)),
        planted: true,
        contact: HumanFoot.offset(props.body, side, "mtp"),
      };
    const end: jumpState.IState = jumpState.of(props.body, resolveHumanPosture.lower(props.body, {
      root: rootL, yaw: props.heading, pitch: 0, roll: 0,
      joints: jumpJoints(props.body, props.upright.joints, 30, 30), limbs,
    }));
    return { start, end };
  }
}
