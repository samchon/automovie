import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGive,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingTarget } from "../striking/StrikingTarget";
import { ReactionSource } from "./ReactionSource";

/** The alternatives of `TurnedSignAxis2`'s site. */
type TurnedSignAxis2 = 1 | 2;

/** The alternatives of `TurnedSignAxis`'s site. */
type TurnedSignAxis = 1 | 2;

/** The alternatives of `TurnedSide`'s site. */
type TurnedSide = 1 | -1;

/** The record of `IReaction3`'s site. */
type IReaction3 = { part: "trunk"; away: IAutoMovieVector3 };

/** The record of `IReaction2`'s site. */
type IReaction2 = {
  part: "head";
  away: IAutoMovieVector3;
  angles: IAutoMovieMotionHumanJoints.Angles;
};

/**
 * Giving way to a contact: the head turned aside by a slap, or the trunk
 * carried by a hand that pushes or pulls, then a return to what the body held.
 * It is the receiver's part of a stage slap, a grab or a light push that does
 * not cost the feet their place; a push that does is `stagger`. A leg giving
 * way to a low kick is not a give: use `stagger` or a short `step`.
 *
 * The contact comes from a target (the striking hand, the grabbing arm), read
 * one look before the start. The head turns about the neck to the side away
 * from it, by `TURN` at full intensity with a slight tilt the same way; the
 * trunk leans from the hips and shifts away from it, or toward it when it
 * pulls. The movement starts at the action's start, peaks after `RISE` and
 * returns over `RETURN`. Sync the action's start to the contact of the action
 * it answers.
 *
 * It rides whatever base the body is on (standing, seated) and claims the head,
 * or the root and the trunk; the feet and the arms stay as they were.
 *
 * Every size and time is provisional: the research located no study of a
 * slapped head's rotation, and the stage-combat convention (the receiver turns
 * the head with the hand's passage) gives the direction only.
 */
export namespace give {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "give";

  /**
   * Cancel table: anything may follow from the peak on, a stagger or a
   * knockdown at any time.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      any: ["fromStroke", "smooth"],
      stagger: ["anytime", "reflex"],
      knockdown: ["anytime", "reflex"],
    });

  /**
   * A reaction interrupts whatever the body was doing, at any instant, as a
   * reflex.
   */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };
  /**
   * The head's turn at full intensity, degrees (provisional), inside the neck's
   * rotation of about 80 degrees each way.
   */
  export const TURN: number = 45;

  /** The head's tilt with the turn at full intensity, degrees (provisional). */
  export const TILT: number = 8;

  /** Seconds to the peak (provisional). */
  export const RISE: number = 0.12;

  /** Seconds held at the peak and seconds of the return (provisional). */
  export const RETURN: readonly [number, number] = [0.15, 0.45];

  /** The trunk's shift at full intensity, a share of the stature (provisional). */
  export const SHIFT: number = 0.03;

  /**
   * Plan the reaction.
   *
   * @param context The action's context.
   * @returns The plan, whose decisive instant is its start.
   * @throws {HumanRefusal} When the intensity lies outside (0, 1].
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGive.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanGive.IParams = context.params;
    const intensity: number = p.intensity ?? 1;
    HumanBound.within("intensity", intensity, 0, 1, "", "minimum");
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
      prepare: 0,
      attack: RISE,
      hold: RETURN[0],
      retract: RETURN[1],
    });
    const rise: readonly [string, string] = [
      AutoMovieMotionClock.START,
      "stroke",
    ];
    const fall: readonly [string, string] = ["relax", AutoMovieMotionClock.END];

    // Away from the contact in the performer's floor frame: `x` left, `z`
    // forward; reversed for a pull.
    // The head's actual place and, for a head reaction, the neck's sign.
    /** The observation transfers only the actual direction and chosen angles. */
    type IReaction = IReaction2 | IReaction3;
    const reaction: IReaction = ((): IReaction => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const headAt: ReturnType<typeof HumanTrunk.prepareResolve> =
        HumanTrunk.prepareResolve(body, HumanBoneGroups.HEAD);
      const trunk: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        headAt(entry, resolution);
      const head: IAutoMovieVector3 = trunk.get("head")!.worldPosition;
      const away: IAutoMovieVector3 = Vector3.scale(
        HumanFrame.local(
          { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
          AutoMovieMotionHumanTarget.away(
            ReactionSource.at(
              context,
              p.target,
              context.start - StrikingTarget.LOOK,
              entry,
              AutoMovieMotionHumanTarget.DEFAULTS.ahead,
            ),
            head,
            entry.yaw,
          ),
        ),
        p.way === "toward" ? -1 : 1,
      );
      return (p.part ?? "head") === "head"
        ? {
            part: "head",
            away,
            angles: turned(
              context,
              trunk,
              away.x >= 0 ? 1 : -1,
              intensity,
              resolution,
              headAt,
            ),
          }
        : { part: "trunk", away };
    })();
    const primitive: IAutoMovieMotionHumanPrimitive =
      reaction.part === "head"
        ? AutoMovieMotionHumanJoints.pulse(clock, rise, fall, reaction.angles)
        : AutoMovieMotionHumanLean.sway({
            body,
            from: 0,
            to: clock.duration,
            angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => {
              const share: number =
                intensity *
                AutoMovieMotionHumanRange.lean("light") *
                clock.envelope(rise, fall, seconds);
              return {
                pitch: share * reaction.away.z,
                roll: -share * reaction.away.x,
              };
            },
            shift: (seconds: number): IAutoMovieVector3 =>
              Vector3.scale(
                reaction.away,
                intensity *
                  AutoMovieMotionHumanRange.shift(body, SHIFT) *
                  clock.envelope(rise, fall, seconds),
              ),
          });
    return {
      ...composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.under(context, clock.duration),
        clock,
        primitives: [primitive],
      }),
      contact: 0,
    };
  }

  /**
   * The neck and head angles that turn and tilt the head to a side: 1 for the
   * performer's left, -1 for the right.
   */
  function turned(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGive.IParams>,
    trunk: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: TurnedSide,
    intensity: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    headAt: ReturnType<typeof HumanTrunk.prepareResolve>,
  ): IAutoMovieMotionHumanJoints.Angles {
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 1, y: 0, z: 0 },
    );

    // Which sign of a neck angle moves the head's forward, or its up, to the left.
    const sign: (axis: TurnedSignAxis, probe: IAutoMovieVector3) => number = (
      axis: TurnedSignAxis2,
      probe: IAutoMovieVector3,
    ): number => {
      const held: readonly [number, number, number] = entry.joints.neck ?? [
        0, 0, 0,
      ];
      const tried: [number, number, number] = [held[0], held[1], held[2]];
      tried[axis] += 10;
      const moved: IAutoMovieVector3 = Quaternion.rotateVector(
        headAt(entry, resolution, { ...entry.joints, neck: tried }).get("head")!
          .worldRotation,
        probe,
      );
      const rest: IAutoMovieVector3 = Quaternion.rotateVector(
        trunk.get("head")!.worldRotation,
        probe,
      );
      return Vector3.dot(Vector3.subtract(moved, rest), left) >= 0 ? 1 : -1;
    };
    const twist: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(
        2,
        side * sign(2, { x: 0, y: 0, z: 1 }) * TURN * intensity,
      );
    const tilt: IAutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(
        1,
        side * sign(1, { x: 0, y: 1, z: 0 }) * TILT * intensity,
      );
    return {
      neck: [0, tilt.neck?.[1] ?? 0, twist.neck?.[2] ?? 0],
      head: [0, tilt.head?.[1] ?? 0, twist.head?.[2] ?? 0],
    };
  }
}
