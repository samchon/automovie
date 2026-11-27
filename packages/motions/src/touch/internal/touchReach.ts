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

import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchLaid } from "../../compose/AutoMovieMotionHumanTouchLaid";
import { HumanHand } from "../../posture/HumanHand";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { touchHold } from "./touchHold";

/** The record of `IPlaceEntry`'s site. */
type IPlaceEntry = {
  posture: IAutoMovieMotionHumanPosture;
  pose: IAutoMoviePose;
};

/** The alternatives of `MeetingSurface`'s site. */
type MeetingSurface = "palm" | "fist";

/**
 * How long a touch's reach must take for its arms to keep within the audit's
 * travel bound (`AutoMovieMotionHumanArmPlanned.reaching`).
 */
export namespace touchReach {
  /**
   * The shortest reach of a touch's hands: for each, from its arm at the entry
   * to the arm laid on its region with the elbow hung naturally, the longest of
   * them.
   *
   * @param body The body.
   * @param entry The entry pose.
   * @param reached The posture the arms are solved on at plan time.
   * @param hands Each hand and its target.
   * @param effector The part of the hand that touches.
   * @param region A target's region at a posture and a second.
   * @param laid How each hand is laid on its target.
   * @returns Seconds.
   */
  export function duration(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMoviePose,
    reached: IAutoMovieMotionHumanPosture,
    hands: readonly (readonly [AutoMovieHumanSide, IAutoMovieMotionTarget])[],
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    region: (
      target: IAutoMovieMotionTarget,
    ) => IAutoMovieMotionHumanTouch.ITouch["region"],
    laid: touchHold.Lay,
  ): number {
    let longest: number = 0;
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    for (const [side, target] of hands) {
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
   * How long a hand's reach to a mutual meeting's point takes: the free-space
   * time of its distance (`AutoMovieMotionHumanTiming.transport`), and at least
   * what its arm's arc needs within the audit's travel bound (`place`) where
   * the performer's posture is known, so the reach the meeting's instant pins
   * meets the bound its arm is laid by.
   *
   * @param body The body.
   * @param bones The performer's world bones where it stands.
   * @param entry Its posture and pose there, when known.
   * @param side The hand.
   * @param surface The surface that meets the point: the palm, or the fist.
   * @param point The meeting's point, world.
   * @returns Seconds.
   */
  export function meeting(
    body: IAutoMovieMotionHumanBody,
    bones: IAutoMovieMotionMeetingRole["bones"],
    entry: IAutoMovieMotionMeetingRole["entry"],
    side: AutoMovieHumanSide,
    surface: MeetingSurface,
    point: IAutoMovieVector3,
  ): number {
    const from: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      side,
      surface,
      "relaxed",
    ).point;
    const free: number = AutoMovieMotionHumanTiming.transport(
      Vector3.distance(point, from),
    );
    return entry === undefined
      ? free
      : Math.max(
          free,
          place(
            body,
            entry,
            side,
            { surface, shape: surface === "fist" ? "fist" : "flat" },
            point,
            "up",
          ),
        );
  }

  /**
   * The shortest reach of one hand to a point: from its arm at the entry to the
   * arm laid there with the elbow hung naturally, its effector's skin on the
   * point and the point's normal looking back at the performer, level, as a
   * mutual meeting lays two hands on their shared point.
   *
   * @param body The body.
   * @param entry The posture and the pose the arm leaves from.
   * @param side The hand.
   * @param effector The part of the hand that meets the point.
   * @param point The point, world.
   * @param tangent Which tangent the effector lies along.
   * @param facing The contact's outward normal, when the frame fixes it.
   * @returns Seconds.
   */
  export function place(
    body: IAutoMovieMotionHumanBody,
    entry: IPlaceEntry,
    side: AutoMovieHumanSide,
    effector: IAutoMovieMotionHumanTouchEffector.IEffector,
    point: IAutoMovieVector3,
    tangent: IAutoMovieMotionHumanTouchForm.Tangent,
    facing?: IAutoMovieVector3,
  ): number {
    const reached: IAutoMovieMotionHumanPosture = entry.posture;
    const back: IAutoMovieVector3 = {
      x: reached.root.x - point.x,
      y: 0,
      z: reached.root.z - point.z,
    };
    const length: number = Math.hypot(back.x, back.z);
    const yaw: number = (reached.yaw * Math.PI) / 180;
    const normal: IAutoMovieVector3 =
      facing ??
      (length > 1e-6
        ? { x: back.x / length, y: 0, z: back.z / length }
        : { x: -Math.sin(yaw), y: 0, z: -Math.cos(yaw) });
    return laidReach(
      body,
      reached,
      entry.pose,
      side,
      effector,
      { point, normal },
      tangent,
    );
  }
}
/** The record of `ILaidReachPlace`'s site. */
type ILaidReachPlace = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/**
 * The shortest reach of one arm onto a place: from its angles at the entry to
 * the arm laid there with the elbow hung naturally, solved on the posture the
 * arms are solved on, and the audit's travel bound between the two
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
  place: ILaidReachPlace,
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
  const arrival: IAutoMovieMotionHumanArmAngles.IAngles =
    AutoMovieMotionHumanArm.angles(
      resolveHumanPosture.seeded(
        body,
        {
          ...reached,
          limbs: { ...reached.limbs, [`${side}Arm`]: goal },
        },
        undefined,
        undefined,
        read,
        undefined,
        project,
      ).pose,
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
