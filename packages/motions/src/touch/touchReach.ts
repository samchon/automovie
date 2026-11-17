import type {
  AutoMovieMotionTarget,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanTouch } from "../compose/IAutoMovieMotionHumanTouch";
import type { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import type { touchHold } from "./touchHold";

/**
 * How long a touch's reach must take for its arms to keep within the audit's
 * travel bound (`AutoMovieMotionHumanArmPlanned.reaching`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the original longest physically fitted arm travel duration and synchronous fixed-body metadata preparation across its actual hands.
 * @evidence contracts/development/design.md#principled-representation Uses canonical body/posture/pose, hand-target pairs, laid goals and existing duration calculation rather than a separate travel score.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One duration query serves the touch law's actual reach clock; physical goals, fits and travel bounds remain with their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every requested hand retains its actual target, full native fit and original travel-bound calculation; only fixed ROM/FK preparation is shared.
 */
export namespace touchReach {
  /**
   * The shortest reach of a touch's hands: for each, from its arm at the
   * entry to the arm laid on its region with the elbow hung naturally, the
   * longest of them.
   *
   * @param body The body.
   * @param entry The entry pose.
   * @param reached The posture the arms are solved on at plan time.
   * @param hands Each hand and its target.
   * @param effector The part of the hand that touches.
   * @param region A target's region at a posture and a second.
   * @param laid How each hand is laid on its target.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States entry/reached frames, ordered hand-target demand, anatomical effector, region/lay readers and seconds output; region may borrow current same-body FK/ROM metadata.
   * @evidence contracts/development/implementation.md#principled-implementation Each actual laid goal is solved by the original full posture resolver, and the original arm travel calculation compares entry and arrival angles before strict longest-duration selection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered hand loop owns goal creation, complete actual fitting and duration comparison; lazy fixed-body metadata is local to this synchronous query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hand, target, goal, rival clearance, authored admission, ROM clamp or physical travel bound is skipped or approximated, and an empty hand list still returns zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms H hands retain H physical fits and H travel calculations; one lazy genuine ROM projector and exact FK workspace remove repeated fixed preparation, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit query fixes one canonical body and reached posture while complete per-hand goals vary. Only genuine same-body metadata reaches the region and native fit; changed targets and poses are actually queried.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Metadata is created only for a real hand and released on return or throw. No goal, pose, map, projector, query callback or history escapes the scalar duration result.
   */
  export function duration(
    body: IHumanBody,
    entry: IAutoMoviePose,
    reached: IHumanPosture,
    hands: readonly (readonly [HumanHand.Side, AutoMovieMotionTarget])[],
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
    region: (target: AutoMovieMotionTarget) => IAutoMovieMotionHumanTouch["region"],
    laid: touchHold.Lay,
  ): number {
    let longest: number = 0;
    let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    let projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
    for (const [side, target] of hands) {
      const read: ReturnType<typeof prepareHumanPoseResolution> = resolution ??= prepareHumanPoseResolution();
      const project: ReturnType<typeof prepareHumanPostureProjection> = projection ??= prepareHumanPostureProjection(body);
      const goal: IHumanPosture.IGoal = AutoMovieMotionHumanTouchLaid.rest(
        body,
        reached,
        side,
        effector,
        region(target)(reached, 0, read, project),
        laid(side, target).tangent,
        AutoMovieMotionHumanBend.hang(body, reached, side),
        "arm",
      );
      const arrival: AutoMovieMotionHumanArm.IAngles =
        AutoMovieMotionHumanArm.angles(
          resolveHumanPosture.seeded(body, {
            ...reached,
            limbs: { ...reached.limbs, [`${side}Arm`]: goal },
          }, undefined, undefined, read, undefined, project).pose,
          side,
        );
      longest = Math.max(
        longest,
        AutoMovieMotionHumanArmPlanned.reaching(
          body,
          reached,
          side,
          AutoMovieMotionHumanArm.angles(entry, side),
          arrival,
        ),
      );
    }
    return longest;
  }
}
