import {
  type IAutoMovieProjectile,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { IThrowObjectParams } from "./IThrowObjectParams";
import { throwObjectCurve } from "./throwObjectCurve";
import { throwObjectForm } from "./throwObjectForm";
import { throwObjectLaunch } from "./throwObjectLaunch";
import { throwObjectLever } from "./throwObjectLever";
import { throwObjectRelease } from "./throwObjectRelease";

/**
 * Throwing a held object to a target: overarm, underarm, or a gentle toss.
 *
 * The goal is a launch: the object, held at the hand's grip, leaves the
 * hand at the release point with the velocity whose drag-free ballistic path
 * passes through the target. The release angle is the style's
 * (`throwObjectForm.ANGLE`, provisional; underarm precision throws regulate
 * speed and angle by distance, Dupuy, Mottet and Ripoll 2000, J Sports Sci
 * 18:375), and the speed follows from the range equation `v^2 = g d^2 / (2
 * cos^2 a (d tan a - h))` for the horizontal distance `d` and the rise `h`
 * to the target; a target the angle cannot reach is refused. The chamber and
 * the finish are places around the standing shoulder in arm lengths
 * (`throwObjectForm.PLACES`, provisional); the release is read from the
 * shoulder of the trunk's release pose, at the arm's reach for the elbow's
 * flexion where a study gives it ({@link throwObjectRelease}). The hand is
 * drawn back to the chamber on minimum-jerk progress (the windup), then
 * driven on a cubic Hermite curve from rest at the chamber to the launch
 * velocity, taking twice the path's length over the launch speed (the time
 * of constant acceleration from rest), carries that velocity unchanged for
 * `throwObjectForm.CARRY` seconds on each side of the release point, so the
 * launch does not depend on the instant the hand opens within it, and goes
 * on to rest at the finish over the same time; it holds, then returns to
 * where it hung. The trunk turns toward the throwing side in the windup, back
 * square to the line by the release and through to the other side by the
 * finish, so the trunk leads the arm (the proximal-to-distal sequence,
 * Putnam 1993, J Biomech 26 Suppl 1:125), and inclines forward from the
 * cocking to the style's `throwObjectForm.TILT` at release (Fleisig et al.
 * 1999), rising again in the recovery. Events: `windup` at the start,
 * `cocked` (the end of cocking, Fleisig et al. 1995's maximum external
 * rotation for an overarm throw), `release`, `followThrough`, `recover`.
 *
 * The plan carries its launch (`of`), so a catcher can intercept the path.
 * A thrown `prop` rides the hand by a grip window to the release and is
 * launched there (`IHumanActionPlan.launches`), so it flies the same path;
 * `angle` replaces the style's release angle for a row with its own. An
 * `implement` held in the hand lengthens the lever the launch leaves from,
 * and a `turns` attitude spins the prop at the lever's rate rounded to whole
 * half turns to the target (`throwObjectLever`). Not yet: the stride, the
 * two-hand chest pass and overhead throws, the thrown prop riding the
 * implement before the release (it leaves from the implement's point, set on
 * its way, until a prop can hold a prop), the release-timing scatter of the
 * endpoint-error model (Hore et al. 1995), and feints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the launch law, the places, the hand's time course, the trunk's sequence, the events and what is missing, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record composed of an arm row and a trunk row over a standing base; the plan carries its launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the style, the launch type, its reader and the plan; the tables are `throwObjectForm`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is a share of the body's arm; the target is the shared target union.
 */
export namespace throwObject {
  /** The action's name. */
  export const name: HumanActionName = "throwObject";

  /** Cancel table: the thrower stands or walks once the follow-through ends. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["followThrough", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    walk: [
      {
        window: ["followThrough", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
  };

  /** May be performed over a carrier, such as seated or while another action carries the body: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /** How the object is thrown. */
  export type Style = throwObjectForm.Style;

  /** Parameters (`IThrowObjectParams`). */
  export type IParams = IThrowObjectParams;

  /** A launch (`throwObjectLaunch.ILaunch`). */
  export type ILaunch = throwObjectLaunch.ILaunch;

  /** Seconds before and after the release through which the hand carries its launch velocity (`throwObjectForm.CARRY`). */
  export const CARRY: number = throwObjectForm.CARRY;

  /** A point of a launch's drag-free path (`throwObjectLaunch.path`). */
  export const path = throwObjectLaunch.path;

  /**
   * The launch a throw's plan carries.
   *
   * @param plan A plan.
   * @returns Its launch, or undefined when it is not a throw's.
   */
  export function of(plan: IHumanActionPlan): ILaunch | undefined {
    return (plan as Partial<IPlan>).launch;
  }

  /** A throw's plan: an action plan with its launch. */
  export interface IPlan extends IHumanActionPlan {
    /** The launch. */
    launch: ILaunch;
  }

  /**
   * Plan a throw.
   *
   * @param context The action's context.
   * @returns The plan with its launch.
   * @throws {HumanRefusal} When the release angle cannot reach the target.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const style: Style = context.params.style ?? "overarm";
    const side: HumanHand.Side = context.params.hand ?? "right";
    const outward: number = side === "left" ? 1 : -1;
    const arm: number = m.upperArm + m.forearm;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const probe: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const yaw: number = probe.yaw;
    const frame: HumanFrame.IFrame = { origin: probe.root, yaw };
    const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]);
    const shoulder: IAutoMovieVector3 = HumanFrame.local(
      frame,
      poseBones(body, resolveHumanPosture.seeded(body, probe, undefined, {}, undefined, shoulderBones).pose,
        undefined, shoulderBones).get(`${side}UpperArm`)!
        .worldPosition,
    );
    const place = (share: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.point(frame, {
        x: shoulder.x + outward * share.x * arm,
        y: shoulder.y + share.y * arm,
        z: shoulder.z + share.z * arm,
      });
    const chamber: IAutoMovieVector3 = place(
      throwObjectForm.PLACES[style].chamber,
    );
    const finish: IAutoMovieVector3 = place(
      throwObjectForm.PLACES[style].finish,
    );
    const target: IAutoMovieVector3 = context.aim(
      context.params.at,
      context.start,
    ).point;

    // The palm faces the target across the floor; the release is read from
    // the trunk's release pose ({@link throwObjectRelease}).
    const from: IAutoMovieVector3 = HumanFrame.point(frame, shoulder);
    const toward: IAutoMovieVector3 = Vector3.normalize({
      x: target.x - from.x,
      y: 0,
      z: target.z - from.z,
    });
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const held: IAutoMovieQuaternion = HumanHand.rotation(
      side,
      style === "overarm"
        ? { fingers: up, palm: toward }
        : { fingers: Vector3.scale(up, -1), palm: toward },
    );
    const release: IAutoMovieVector3 = throwObjectRelease.point({
      body,
      side,
      style,
      standing: probe,
      held,
    });

    // The launch velocity by the range equation at the style's angle, from
    // the lever's end; the hand carries its share (`throwObjectLever`).
    const delta: IAutoMovieVector3 = Vector3.subtract(target, release);
    const d: number = Math.hypot(delta.x, delta.z);
    const degrees: number =
      context.params.angle ?? throwObjectForm.ANGLE[style];
    const implement: throwObjectLever.IImplement | undefined =
      context.params.implement;
    const lever: throwObjectLever.ILever | undefined = throwObjectLever.of({
      context,
      side,
      shoulder: from,
      release,
      held,
      target,
      degrees,
      implement,
    });
    if (lever === undefined)
      throw new HumanRefusal({
        kind: "reach",
        axis: "at",
        value: d,
        reason: `a ${style} throw at ${degrees} degrees cannot reach a target ${delta.y.toFixed(2)} m above and ${d.toFixed(2)} m from its release`,
        fix: "aim at a nearer or lower target, or choose a style with a steeper release",
      });
    const velocity: IAutoMovieVector3 = lever.hand;
    const speed: number = Vector3.length(velocity);

    // The clock: windup, acceleration from rest to the launch, follow-through
    // to rest, a short hold and the return.
    const before: IAutoMovieVector3 = Vector3.subtract(
      release,
      Vector3.scale(velocity, throwObjectForm.CARRY),
    );
    const after: IAutoMovieVector3 = Vector3.add(
      release,
      Vector3.scale(velocity, throwObjectForm.CARRY),
    );
    const accelerate: number =
      throwObjectForm.CARRY +
      (2 * Vector3.length(Vector3.subtract(before, chamber))) / speed;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence([
        { name: "windup", seconds: throwObjectForm.WINDUP[style] },
        { name: "cocked", seconds: accelerate },
        { name: "release", seconds: 2 * accelerate },
        { name: "followThrough", seconds: 0.15 },
        { name: "recover", seconds: 0.5 },
      ]),
      modifiers,
      { holds: ["followThrough"], fixed: ["cocked", "release"] },
    );
    const duration: number = clock.duration;
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );

    const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const accelerating: number = clock.at("release") - throwObjectForm.CARRY - clock.at("cocked");
    const following: number = clock.at("followThrough") - clock.at("release") - throwObjectForm.CARRY;
    const accelerateCurve: ReturnType<typeof throwObjectCurve> =
      throwObjectCurve(chamber, still, before, velocity, accelerating);
    const followCurve: ReturnType<typeof throwObjectCurve> =
      throwObjectCurve(after, velocity, finish, still, following);
    const restBones: ReturnType<typeof poseBones> = poseBones(body, context.entry.pose,
      undefined, new Set<AutoMovieHumanoidBone>([`${side}Hand`]));
    const origin: AutoMovieMotionHumanArm.IOrigin =
      AutoMovieMotionHumanArm.origin(
        body,
        restBones,
        { origin: context.entry.posture.root, yaw: context.entry.posture.yaw },
        side,
        "grip",
      );
    // The hand's turn before and after the carry: the lever's, `held`
    // without an implement.
    const cocking: IAutoMovieQuaternion = lever.rotation(
      -throwObjectForm.CARRY,
    );
    const carriedOut: IAutoMovieQuaternion = lever.rotation(
      throwObjectForm.CARRY,
    );
    const finished: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: toward,
      palm: Vector3.scale(up, -1),
    });
    const grip = (
      posture: IHumanPosture,
      seconds: number,
    ): { point: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => {
      const rest: IAutoMovieVector3 = AutoMovieMotionHumanArm.point(
        posture,
        origin,
      );
      const restTurn: IAutoMovieQuaternion = Quaternion.multiply(
        HumanFrame.turn(posture.yaw),
        origin.rotation,
      );
      const at = (name: string): number => clock.at(name);
      if (seconds <= at("cocked")) {
        const u: number = clock.progress("windup", "cocked", seconds);
        return {
          point: Vector3.lerp(rest, chamber, u),
          rotation: Quaternion.slerp(restTurn, cocking, u),
        };
      }
      // The carry: the hand's share of the launch held through the release,
      // turning with the lever.
      const carried: number = seconds - at("release");
      if (Math.abs(carried) <= throwObjectForm.CARRY)
        return {
          point: Vector3.add(release, Vector3.scale(velocity, carried)),
          rotation:
            carried <= 0
              ? lever.rotation(carried)
              : Quaternion.slerp(
                  lever.rotation(carried),
                  finished,
                  minimumJerk.share(clock.linear("release", "followThrough", seconds)),
                ),
        };
      if (seconds <= at("release")) {
        return {
          point: accelerateCurve((seconds - at("cocked")) / accelerating),
          rotation: cocking,
        };
      }
      if (seconds <= at("followThrough")) {
        return {
          point: followCurve((carried - throwObjectForm.CARRY) / following),
          rotation: Quaternion.slerp(
            carriedOut,
            finished,
            minimumJerk.share(clock.linear("release", "followThrough", seconds)),
          ),
        };
      }
      const u: number = clock.progress("recover", "end", seconds);
      return {
        point: Vector3.lerp(finish, rest, u),
        rotation: Quaternion.slerp(finished, restTurn, u),
      };
    };
    const prop: string | undefined = context.params.prop;
    const throwing: IAutoMovieMotionHumanPrimitive = {
      channels: [`${side}Arm`, `${side}Hand`],
      from: 0,
      to: duration,

      // A thrown prop rides the hand until the release; an implement stays
      // in it throughout.
      contacts:
        implement === undefined
          ? throwObjectLaunch.held(prop, side, clock.at("release") / duration)
          : throwObjectLaunch.held(implement.prop, side, 1),
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const g = grip(posture, seconds);
        const wrist: HumanHand.IWrist = HumanHand.place(
          body,
          side,
          "grip",
          g.point,
          g.rotation,
          "relaxed",
        );
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [`${side}Arm`]: AutoMovieMotionHumanArm.goal(body, side, {
              surface: "grip",
              shape: "relaxed",
              point: g.point,
              rotation: g.rotation,
              bend: AutoMovieMotionHumanBend.solve({
                body,
                posture,
                side,
                point: wrist.point,
                rotation: g.rotation,
                fallback: "hang",
              }),
            }),
          },
        };
      },
    };

    // The trunk turns toward the throwing side in the windup, back square to
    // the line by the release and through to the other side by the finish,
    // ahead of the arm; it inclines forward from the cocking to the release
    // and rises again in the recovery.
    const turn: number = outward * throwObjectForm.TURN[style];
    const trunk: IAutoMovieMotionHumanPrimitive = {
      channels: ["trunk"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const degrees: number =
          turn *
            clock.envelope(
              ["windup", "cocked"],
              ["cocked", "release"],
              seconds,
            ) -
          0.6 *
            turn *
            clock.envelope(
              ["release", "followThrough"],
              ["recover", "end"],
              seconds,
            );
        const tilt: number =
          throwObjectForm.TILT[style] *
          clock.envelope(["cocked", "release"], ["recover", "end"], seconds);
        return {
          ...posture,
          joints: throwObjectRelease.trunk(posture.joints, degrees, tilt),
        };
      },
    };

    const asked: IParams["attitude"] = context.params.attitude;
    const attitude: IAutoMovieProjectile.Attitude | undefined =
      asked?.kind !== "turns"
        ? asked
        : prop === undefined
          ? undefined
          : throwObjectLever.spin(context, side, prop, lever, target);
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "release",
      primitives: [trunk, throwing],
    });
    return {
      ...composed,
      launch: {
        point: lever.point,
        velocity: lever.velocity,
        seconds: clock.at("release"),
        target,
      },
      // The prop leaves the lever's end with the support's velocity added
      // (#3491), turning as asked or at the act's chosen spin.
      launches: throwObjectLaunch.launches(prop, attitude, {
        point: lever.point,
        velocity: Vector3.add(
          lever.velocity,
          HumanSupportFrame.at(context, context.start + clock.at("release"))
            .velocity,
        ),
        seconds: clock.at("release"),
        target,
      }),
    };
  }
}
