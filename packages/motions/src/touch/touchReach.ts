import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchLaid } from "../compose/AutoMovieMotionHumanTouchLaid";
import { HumanHand } from "../posture/HumanHand";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered hand loop reads each hand's region and lay and compares durations; goal creation, the complete fit and the travel bound are the one arm-onto-place measurement `place` shares; lazy fixed-body metadata is local to this synchronous query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No hand, target, goal, rival clearance, authored admission, ROM clamp or physical travel bound is skipped or approximated, and an empty hand list still returns zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms H hands retain H physical fits and H travel calculations; one lazy genuine ROM projector and exact FK workspace remove repeated fixed preparation, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit query fixes one canonical body and reached posture while complete per-hand goals vary. Only genuine same-body metadata reaches the region and native fit; changed targets and poses are actually queried.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Metadata is created only for a real hand and released on return or throw. No goal, pose, map, projector, query callback or history escapes the scalar duration result.
   */
  export function duration(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMoviePose,
    reached: IAutoMovieMotionHumanPosture,
    hands: readonly (readonly [AutoMovieHumanSide, IAutoMovieMotionTarget])[],
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    region: (target: IAutoMovieMotionTarget) => IAutoMovieMotionHumanTouch.ITouch["region"],
    laid: touchHold.Lay,
  ): number {
    let longest: number = 0;
    let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    let projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
    for (const [side, target] of hands) {
      const read: ReturnType<typeof prepareHumanPoseResolution> = resolution ??= prepareHumanPoseResolution();
      const project: ReturnType<typeof prepareHumanPostureProjection> = projection ??= prepareHumanPostureProjection(body);
      longest = Math.max(
        longest,
        laidReach(
          body,
          reached,
          entry,
          side,
          effector,
          region(target)(reached, 0, read, project),
          laid(side, target).tangent,
          read,
          project,
        ),
      );
    }
    return longest;
  }

  /**
   * How long a hand's reach to a mutual meeting's point takes: the
   * free-space time of its distance (`AutoMovieMotionHumanTiming.transport`),
   * and at least what its arm's arc needs within the audit's travel bound
   * (`place`) where the performer's posture is known, so the reach the
   * meeting's instant pins meets the bound its arm is laid by.
   *
   * @param body The body.
   * @param bones The performer's world bones where it stands.
   * @param entry Its posture and pose there, when known.
   * @param side The hand.
   * @param surface The surface that meets the point: the palm, or the fist.
   * @param point The meeting's point, world.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two times taken and when the arm's is read.
   * @evidence contracts/development/implementation.md#principled-implementation The free-space time of the hand's distance, raised to the arm's own reach where the arc is longer than that time allows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance, one arm reach, their larger.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A role whose posture is not known keeps the free-space time.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame read and `place`'s one posture solve and arc.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each role is timed once by its meeting.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function meeting(
    body: IAutoMovieMotionHumanBody,
    bones: IAutoMovieMotionMeetingRole["bones"],
    entry: IAutoMovieMotionMeetingRole["entry"],
    side: AutoMovieHumanSide,
    surface: "palm" | "fist",
    point: IAutoMovieVector3,
  ): number {
    const from: IAutoMovieVector3 = HumanHand.frame(body, bones, side, surface, "relaxed").point;
    const free: number = AutoMovieMotionHumanTiming.transport(Vector3.distance(point, from));
    return entry === undefined
      ? free
      : Math.max(free, place(body, entry, side,
          { surface, shape: surface === "fist" ? "fist" : "flat" }, point, "up"));
  }

  /**
   * The shortest reach of one hand to a point: from its arm at the entry to
   * the arm laid there with the elbow hung naturally, its effector's skin on
   * the point and the point's normal looking back at the performer, level,
   * as a mutual meeting lays two hands on their shared point.
   *
   * @param body The body.
   * @param entry The posture and the pose the arm leaves from.
   * @param side The hand.
   * @param effector The part of the hand that meets the point.
   * @param point The point, world.
   * @param tangent Which tangent the effector lies along.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the region the point is read as and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The arm laid on the point as `duration` lays it on a region, solved by the posture resolver, and the observation's travel bound between it and the entry's arm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One level normal, then the arm-onto-place measurement `duration` shares: one goal, one solve, one travel bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arc is the arm's fitted blend, never the hand's straight distance; a point at the performer's own place has no level normal and is faced forward.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve and the observation's arc samples.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each meeting role is measured once by its caller.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    entry: { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose },
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    point: IAutoMovieVector3,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
  ): number {
    const reached: IAutoMovieMotionHumanPosture = entry.posture;
    const back: IAutoMovieVector3 = { x: reached.root.x - point.x, y: 0, z: reached.root.z - point.z };
    const length: number = Math.hypot(back.x, back.z);
    const yaw: number = (reached.yaw * Math.PI) / 180;
    const normal: IAutoMovieVector3 = length > 1e-6
      ? { x: back.x / length, y: 0, z: back.z / length }
      : { x: -Math.sin(yaw), y: 0, z: -Math.cos(yaw) };
    return laidReach(body, reached, entry.pose, side, effector, { point, normal }, tangent);
  }
}

/**
 * The shortest reach of one arm onto a place: from its angles at the entry
 * to the arm laid there with the elbow hung naturally, solved on the posture
 * the arms are solved on, and the audit's travel bound between the two
 * (`touchReach.duration` for a region, `touchReach.place` for a point).
 *
 * @param body The body.
 * @param reached The posture the arm is laid on.
 * @param entry The pose the arm leaves from.
 * @param side The hand.
 * @param effector The part of the hand laid on the place.
 * @param place The place's point and outward normal, world.
 * @param tangent Which tangent the effector lies along.
 * @param read The caller's exact FK workspace, when it lends one.
 * @param project The caller's range-of-motion projector, when it lends one.
 * @returns Seconds.
 */
function laidReach(
  body: IAutoMovieMotionHumanBody,
  reached: IAutoMovieMotionHumanPosture,
  entry: IAutoMoviePose,
  side: AutoMovieHumanSide,
  effector: IAutoMovieMotionHumanTouchEffector.IEffector,
  place: { point: IAutoMovieVector3; normal: IAutoMovieVector3 },
  tangent: IAutoMovieMotionHumanTouchForm.Tangent,
  read?: ReturnType<typeof prepareHumanPoseResolution>,
  project?: ReturnType<typeof prepareHumanPostureProjection>,
): number {
  const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchLaid.rest(
    body,
    reached,
    side,
    effector,
    place,
    tangent,
    AutoMovieMotionHumanBend.hang(body, reached, side),
    "arm",
  );
  const arrival: IAutoMovieMotionHumanArmAngles.IAngles = AutoMovieMotionHumanArm.angles(
    resolveHumanPosture.seeded(body, {
      ...reached,
      limbs: { ...reached.limbs, [`${side}Arm`]: goal },
    }, undefined, undefined, read, undefined, project).pose,
    side,
  );
  return AutoMovieMotionHumanArmPlanned.reaching(
    body,
    reached,
    side,
    AutoMovieMotionHumanArm.angles(entry, side),
    arrival,
  );
}
