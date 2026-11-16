import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingTarget } from "../striking/StrikingTarget";
import { ReactionSource } from "./ReactionSource";

/**
 * Giving way to a contact: the head turned aside by a slap, or the trunk
 * carried by a hand that pushes or pulls, then a return to what the body
 * held. It is the receiver's part of a stage slap, a grab or a light push
 * that does not cost the feet their place; a push that does is `stagger`.
 *
 * The contact comes from a target (the striking hand, the grabbing arm),
 * read one look before the start. The head turns about the neck to the side
 * away from it, by `TURN` at full intensity with a slight tilt the same way;
 * the trunk leans from the hips and shifts away from it, or toward it when
 * it pulls. The movement starts at the action's start, peaks after `RISE`
 * and returns over `RETURN`. Sync the action's start to the contact of the
 * action it answers.
 *
 * It rides whatever base the body is on (standing, seated) and claims the
 * head, or the root and the trunk; the feet and the arms stay as they were.
 *
 * Every size and time is provisional: #3347 located no study of a slapped
 * head's rotation, and the stage-combat convention (the receiver turns the
 * head with the hand's passage) gives the direction only.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what gives way, the direction rule, the time course, the base it rides and that the sizes are provisional.
 * @evidence contracts/development/design.md#principled-representation A law record composed of one joint pulse or one sway on a phrase clock over the inherited base; the part and the way are closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel tables, the parameters, the constants and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union, the head's neck share and the lean primitive; no striker is named.
 */
export namespace give {
  /** The action's name. */
  export const name: HumanActionKey = "give";

  /** Cancel table: anything may follow from the peak on, a stagger or a knockdown at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      any: ["fromStroke", "smooth"],
      stagger: ["anytime", "reflex"],
      knockdown: ["anytime", "reflex"],
    });

  /** A reaction interrupts whatever the body was doing, at any instant, as a reflex. */
  export const accepts: IHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /** Parameters for the inherited-base contact reaction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state the source/default, closed reacting part and direction, and normalized intensity range/default.
   * @evidence contracts/development/design.md#principled-representation The original target union identifies contact, closed part/way unions identify the physical response, and dimensionless intensity scales the law's named provisional angles/shift under runtime bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Plan consumes exactly these four author inputs; shared motion-target and HumanUnit types retain their existing ownership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No performer, posture or physical result is encoded in the type; the original source fallback and HumanBound admission remain in the actual planner.
   */
  export interface IParams {
    /** Where the contact comes from; a place ahead of the performer when absent. */
    from?: AutoMovieMotionTarget;

    /** What gives way; `head` when absent. */
    part?: "head" | "trunk";

    /** Whether the part goes away from the contact (a slap, a push) or toward it (a pull); `away` when absent. */
    way?: "away" | "toward";

    /** How strong, in (0, 1]; 1 when absent. */
    intensity?: number &
      tags.ExclusiveMinimum<0> &
      tags.Maximum<1> &
      HumanUnit<"">;
  }

  /** The head's turn at full intensity, degrees (provisional), inside the neck's rotation of about 80 degrees each way. */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan's decisive instant and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The part rises to its peak and falls back on the clock's minimum-jerk envelope (Flash and Hogan 1985). The side is the contact's side in the performer's floor frame. The sign of the neck's twist that turns the head to that side is found by forward kinematics of the entry posture, so it does not rest on a rig convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, the inherited base and one primitive chosen by the part.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact dead ahead or behind turns the head to the left, a stated tie rule; sizes are named provisional constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads only head ancestry after full authored-joint admission: one original entry read and the two original neck-axis trials for a head reaction, with constant work per written posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous observation lends its exact FK workspace to the entry and both actual joint-override trials; the unchanged head request omits only unrelated bone transforms and the direction is still read once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The observation IIFE releases its lazy FK workspace before constructing the returned primitive; only its direction and computed head angles escape, never an FK reader, callback or posed-result cache.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const p: IParams = context.params;
    const intensity: number = p.intensity ?? 1;
    HumanBound.within("intensity", intensity, 0, 1, "", "minimum");
    const body: IHumanBody = context.body;
    const entry: IHumanPosture = context.entry.posture;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
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
    type IReaction =
      | {
          part: "head";
          away: IAutoMovieVector3;
          angles: AutoMovieMotionHumanJoints.Angles;
        }
      | { part: "trunk"; away: IAutoMovieVector3 };
    const reaction: IReaction = ((): IReaction => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const trunk: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(body, entry, entry.joints, resolution, HEAD);
      const head: IAutoMovieVector3 = trunk.get("head")!.worldPosition;
      const away: IAutoMovieVector3 = Vector3.scale(
        HumanFrame.local(
          { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
          AutoMovieMotionHumanTarget.away(
            ReactionSource.at(
              context,
              p.from,
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
            angles: turned(context, trunk, away.x >= 0 ? 1 : -1, intensity, resolution),
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
            angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => {
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

  /** The neck and head angles that turn and tilt the head to a side: 1 for the performer's left, -1 for the right. */
  function turned(
    context: IHumanActionContext<IParams>,
    trunk: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: 1 | -1,
    intensity: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
  ): AutoMovieMotionHumanJoints.Angles {
    const entry: IHumanPosture = context.entry.posture;
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 1, y: 0, z: 0 },
    );

    // Which sign of a neck angle moves the head's forward, or its up, to the left.
    const sign: (axis: 1 | 2, probe: IAutoMovieVector3) => number = (
      axis: 1 | 2,
      probe: IAutoMovieVector3,
    ): number => {
      const held: readonly [number, number, number] = entry.joints.neck ?? [
        0, 0, 0,
      ];
      const tried: [number, number, number] = [held[0], held[1], held[2]];
      tried[axis] += 10;
      const moved: IAutoMovieVector3 = Quaternion.rotateVector(
        HumanTrunk.resolve(
          context.body,
          entry,
          { ...entry.joints, neck: tried },
          resolution,
          HEAD,
        ).get("head")!.worldRotation,
        probe,
      );
      const rest: IAutoMovieVector3 = Quaternion.rotateVector(
        trunk.get("head")!.worldRotation,
        probe,
      );
      return Vector3.dot(Vector3.subtract(moved, rest), left) >= 0 ? 1 : -1;
    };
    const twist: AutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(
        2,
        side * sign(2, { x: 0, y: 0, z: 1 }) * TURN * intensity,
      );
    const tilt: AutoMovieMotionHumanJoints.Angles =
      AutoMovieMotionHumanHead.share(
        1,
        side * sign(1, { x: 0, y: 1, z: 0 }) * TILT * intensity,
      );
    return {
      neck: [0, tilt.neck?.[1] ?? 0, twist.neck?.[2] ?? 0],
      head: [0, tilt.head?.[1] ?? 0, twist.head?.[2] ?? 0],
    };
  }

  /** All reaction observations read only this head and its actual ancestry. */
  const HEAD: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    "head",
  ]);
}
