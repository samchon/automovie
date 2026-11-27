import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** The alternatives of `OfContext`'s site. */
type OfContext = "body" | "entry";

/**
 * The other arm brought up for a hand to touch a region on it: its forearm held
 * across the front of the waist, the wrist on the body's midline half way from
 * the hips to the shoulders and a forearm's length ahead of the hips, the palm
 * down and the fingers toward the touching hand, the elbow on the hanging arm's
 * side. Null when the region does not ride the other arm.
 *
 * @param context The action's context.
 * @param side The touching hand.
 * @param target The touch's target.
 * @returns The presented arm, or null.
 */
export function touchPresented(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  side: AutoMovieHumanSide,
  target: IAutoMovieMotionTarget,
): touchPresented.IPresented | null {
  if (target.kind !== "self") return null;
  const body = context.body;
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  const bone = body.surfaces.regions[target.region].bone;
  if (
    bone !== `${other}UpperArm` &&
    bone !== `${other}LowerArm` &&
    bone !== `${other}Hand`
  )
    return null;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const frame: IAutoMovieMotionHumanFrame = {
    origin: entry.root,
    yaw: entry.yaw,
  };
  const hips: IAutoMovieVector3 = body.rest.get("hips")!;
  const shoulder: IAutoMovieVector3 = body.rest.get(`${other}UpperArm`)!;
  const at: IAutoMovieVector3 = HumanFrame.point(frame, {
    x: 0,
    y: (hips.y + shoulder.y) / 2,
    z: hips.z + body.measure.forearm,
  });
  // The fingers point toward the touching hand's side: world +X is the
  // body's left at yaw 0.
  const across: IAutoMovieVector3 = Quaternion.rotateVector(
    HumanFrame.turn(entry.yaw),
    { x: side === "left" ? 1 : -1, y: 0, z: 0 },
  );
  const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanTouchEffector.goal(
    body,
    other,
    { surface: "palm", shape: "flat" },
    at,
    { x: 0, y: 1, z: 0 },
    across,
    AutoMovieMotionHumanBend.arm(body, entry, other, "hang"),
  );
  return {
    side: other,
    goal,
    bones: poseBones(
      body,
      resolveHumanPosture(body, {
        ...entry,
        limbs: { ...entry.limbs, [`${other}Arm`]: goal },
      }),
    ),
  };
}

/**
 * The other arm brought up so a hand can touch a region on it: the touch law's
 * presentation of a forearm, a wrist or a hand to be scratched, patted or
 * looked at.
 */
export namespace touchPresented {
  /**
   * Carry the presented arm through the touch's entry, hold and return.
   *
   * @param body The touching body.
   * @param entry Its actual entry pose.
   * @param shown The presented arm already planned on that entry.
   * @param clock The touch's phrase clock.
   * @returns The arm primitive with the original explicit carry span.
   */
  export function carry(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMoviePose,
    shown: IPresented,
    clock: IAutoMovieMotionClock,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanArm.carried({
      body,
      side: shown.side,
      from: 0,
      to: clock.duration,
      rest: AutoMovieMotionHumanArm.angles(entry, shown.side),
      goal: (): IAutoMovieHumanLimbGoal => shown.goal,
      weight: (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds),
      span: {
        start: clock.at("start"),
        ready: clock.at("ready"),
        relax: clock.at("relax"),
        end: clock.at("end"),
      },
    });
  }

  /** An arm brought up to be touched. */
  export interface IPresented {
    /** The arm. */
    side: AutoMovieHumanSide;

    /** Its goal, world, on the entry posture. */
    goal: IAutoMovieHumanLimbGoal;

    /** The body's bones with that arm at its goal. */
    bones: ReturnType<typeof poseBones>;
  }
}
