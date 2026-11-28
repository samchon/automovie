import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanPosture } from "../../posture/internal/HumanPosture";
import { orderHumanLimbs } from "../../posture/internal/orderHumanLimbs";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { refitHumanPosture } from "../../posture/internal/refitHumanPosture";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { HumanSegmentPoseSeeds } from "./HumanSegmentPoseSeeds";

/*
 * The final planted-limb refit of a displayed pose after its range clamp. The
 * pose evaluator retains clamp/transition order and named-seed assembly.
 */
export namespace HumanSegmentPlant {
  /*
   * Preserve an articulated toe whose own socket is the active plant's contact.
   * The contact is computed for the pre-offset toe angle. Inertia in that child
   * would move the held socket even after the ankle's final refit. The heel and
   * the ball of the foot ride the foot bone and need no child correction.
   * Parameter body: The performer's fixed foot and toe geometry.
   * Parameter limbs: The current contact goals with foot-local offsets.
   * Parameter before: The pose before applying the entering joint offset.
   * Parameter offset: The result of the entering offset at that second.
   * Returns: The original offset pose or a copy with its bearing toes restored.
   */
  export function preserveBearingToes(
    body: IAutoMovieMotionHumanBody,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    before: IAutoMoviePose,
    offset: IAutoMoviePose,
  ): IAutoMoviePose {
    let joints: IAutoMoviePose["joints"] | undefined;
    for (const side of ["left", "right"] as const) {
      const bone = `${side}Toes` as const;
      const socket =
        body.surfaces.sockets[side === "left" ? "toeLeft" : "toeRight"];
      const goal = limbs[`${side}Leg`];
      if (
        socket.bone !== bone ||
        goal?.planted !== true ||
        goal.contact === undefined
      )
        continue;
      const authored = before.joints.find((joint) => joint.bone === bone);
      if (authored === undefined) continue;
      const toe = HumanFoot.offset(body, side, "toe", authored.flexion ?? 0);
      const error = Math.hypot(
        toe.x - goal.contact.x,
        toe.y - goal.contact.y,
        toe.z - goal.contact.z,
      );
      // Identify the same authored socket despite round-off in local placement.
      if (!(error <= 1e-10)) continue;
      const index = offset.joints.findIndex((joint) => joint.bone === bone);
      if (index < 0) continue;
      const shifted = offset.joints[index]!;
      if (
        shifted.flexion === authored.flexion &&
        shifted.abduction === authored.abduction &&
        shifted.twist === authored.twist
      )
        continue;
      (joints ??= [...offset.joints])[index] = authored;
    }
    return joints === undefined ? offset : { ...offset, joints };
  }
  /*
   * Whether a displayed pose's planted limbs already stand on their goals when
   * the final clamp returns: the evaluation fitted each planted goal itself
   * (its leaf fit), nothing moved the pose between that fit and the clamp, and
   * the clamp left every record of each planted limb as the fit wrote it. The
   * planted stage exists so that a fade, an offset or the clamp cannot move a
   * contact; when none of them touched the limb, the leaf fit's solution of
   * that same goal is the contact's, and its seed is recorded as the planted
   * stage's.
   * Parameter before: The pose the leaf fits left, before the final clamp.
   * Parameter clamped: The same pose after the clamp, record for record in the same
   * order.
   * Parameter limbs: The current complete goals.
   * Parameter seeds: The evaluation's named seeds; each planted limb's `planted:`
   * seed is set from its `leaf::` seed when the result is true.
   * Returns: Whether every planted limb keeps its leaf solution; false sends
   * the pose to fit.
   */
  export function settled(
    before: IAutoMoviePose,
    clamped: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    seeds: HumanSegmentPose.IFits,
  ): boolean {
    const planted: AutoMovieHumanLimb[] = [];
    const bones: Set<string> = new Set();
    for (const limb of HumanPosture.LIMBS) {
      if (limbs[limb]?.planted !== true) continue;
      if (!seeds.has(`leaf::${limb}`)) return false;
      planted.push(limb);
      const side: AutoMovieHumanSide = limb.startsWith("left")
        ? "left"
        : "right";
      for (const part of limb.endsWith("Arm")
        ? ["UpperArm", "LowerArm", "Hand"]
        : ["UpperLeg", "LowerLeg", "Foot", "Toes"])
        bones.add(`${side}${part}`);
    }
    if (before.joints.length !== clamped.joints.length) return false;
    for (let i: number = 0; i < before.joints.length; ++i) {
      const was: IAutoMoviePose["joints"][number] = before.joints[i]!;
      if (!bones.has(was.bone)) continue;
      const now: IAutoMoviePose["joints"][number] = clamped.joints[i]!;
      if (
        now.bone !== was.bone ||
        !Object.is(now.flexion, was.flexion) ||
        !Object.is(now.abduction, was.abduction) ||
        !Object.is(now.twist, was.twist)
      )
        return false;
    }
    for (const limb of planted)
      seeds.set(`planted:${limb}`, seeds.get(`leaf::${limb}`) ?? null);
    return true;
  }

  /*
   * Refit every planted goal on the already clamped displayed pose. With
   * plants, attachment admission precedes resolution even on cold queries.
   * Parameter body: The performer whose unchanged rig resolves the goals.
   * Parameter pose: The pose after the displayed evaluator's final clamp.
   * Parameter limbs: The current complete goals, including carried or stopped ones.
   * Parameter near: Nearby fits, matched only by each existing planted-stage name.
   * Returns: The resolver's pose, seeds and values with their original
   * ownership.
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limbs: IAutoMovieMotionHumanPosture["limbs"],
    near?: HumanSegmentPose.INear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    const selected: [string, IAutoMovieHumanLimbGoal][] = Object.entries(
      limbs,
    ).filter(
      ([, goal]: [string, IAutoMovieHumanLimbGoal]): boolean =>
        goal.planted === true,
    );
    if (selected.length === 0 && !HumanSegmentPoseSeeds.continues(near))
      return { pose, seeds: {}, values: {} };
    const plants: IAutoMovieMotionHumanPosture["limbs"] =
      Object.fromEntries(selected);
    const ordered: AutoMovieHumanLimb[] = orderHumanLimbs(plants);

    // The pose is this evaluation's own clamped intermediate, so the private
    // refit may share its untouched records instead of issuing clones.
    return refitHumanPosture(
      body,
      pose,
      plants,
      near === undefined
        ? {}
        : Object.fromEntries(
            ordered.flatMap(
              (
                limb: AutoMovieHumanLimb,
              ): [AutoMovieHumanLimb, IAutoMovieSwivelNear][] => {
                const continued: IAutoMovieSwivelNear | undefined =
                  HumanSegmentPose.nearby(near, `planted:${limb}`);
                return continued === undefined ? [] : [[limb, continued]];
              },
            ),
          ),
      resolution,
    );
  }
}
