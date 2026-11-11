import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { throwObject } from "./throwObject";

/**
 * Catching an object thrown by another action: the hands meet it where its
 * path enters the reach, give with it, and bring it to the chest.
 *
 * The goal is an interception. The throw's plan carries its launch
 * (`throwObject.of`), so the path is known in closed form, drag-free. The
 * catch point is where the path first comes within `REACH` arm lengths
 * ahead of the catcher's root along its heading (provisional), and the
 * contact instant the path's time there; a path that never comes so near,
 * or a point the arms cannot reach from the shoulders, is refused. With two
 * hands the palms take the object from both sides, each palm on its surface
 * across the catcher's left-right axis; with one the palm takes it from
 * behind, facing the way it comes. The hands travel there on minimum-jerk
 * progress over the aimed movement time to an object of its size (McIntosh
 * et al. 2018, `AutoMovieMotionHumanTiming.aimed`), arriving at contact;
 * the anticipatory `prepare` instant is 100 ms before impact (Lacquaniti and
 * Maioli 1989, J Neurosci 9:134). After contact the hands give `GIVE` along
 * the object's velocity over `GIVE_TIME` (the issue's 0.05 to 0.15 m,
 * provisional), which is `secured`, then carry it to before the sternum and
 * hold it. Events: `reach`, `prepare`, `contact`, `secured`, `held`.
 *
 * Not yet: hand closure timed by optical expansion (Savelsbergh et al.
 * 1991), a running catch (McLeod and Dienes 1996), a fumble, the catch
 * against the chest, and a held prop handed from the throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interception, the hands' places, their timing with sources, the give, the events, the refusals and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record composed of arm rows over a standing base, reading the throw's launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the object reader and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The path comes from the throw's plan, never typed.
 */
export namespace catchObject {
  /** The action's name. */
  export const name: HumanActionName = "catchObject";

  /** Cancel table: a secured catch is thrown back, stood with, or walked with. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    throwObject: [
      { window: ["secured", 1], kind: "inertialize", entry: 0, blend: 0.2 },
    ],
    stand: [{ window: ["secured", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    walk: [{ window: ["secured", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The throw's anchor, the hands and the object's size.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No catch point is typed by the author.
   */
  export interface IParams {
    /** The anchor of the throw caught. */
    from: string;

    /** One hand or two; `two` when absent. */
    hands?: "one" | "two";

    /** The catching hand when one; `right` when absent. */
    side?: HumanHand.Side;

    /** The object's radius, metres; 0.11 when absent (a handball, provisional). */
    radius?: number;
  }

  /** How far ahead of the root the object is met, arm lengths (provisional). */
  export const REACH: number = 0.6;

  /** How far the hands give with the object after contact, metres (provisional). */
  export const GIVE: number = 0.1;

  /** How long the give takes, seconds (provisional). */
  export const GIVE_TIME: number = 0.15;

  /** A catch's plan: an action plan with the object's place over time. */
  export interface IPlan extends IHumanActionPlan {
    /**
     * The object's centre at a second of the action.
     *
     * @param seconds Seconds since the action's start.
     * @returns World metres.
     */
    object(seconds: number): IAutoMovieVector3;
  }

  /**
   * Plan a catch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the anchor is not a throw, the path never comes within reach, or the catch would start before the action.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const radius: number = context.params.radius ?? 0.11;
    const placed = context.action(context.params.from);
    const launch: throwObject.ILaunch | undefined = throwObject.of(placed.plan);
    if (launch === undefined)
      throw new Error(
        `${context.subject}: ${context.params.from} is a ${placed.name}, not a throw`,
      );
    const released: number = placed.start + launch.seconds - context.start;
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const frame: HumanFrame.IFrame = {
      origin: { ...standing.root, y: 0 },
      yaw: standing.yaw,
    };

    // The interception: where the path first comes REACH arms ahead.
    const ahead = (u: number): number =>
      HumanFrame.local(frame, throwObject.path(launch, u)).z - REACH * arm;
    if (ahead(0) <= 0)
      throw new Error(`${context.subject}: the throw starts within the reach`);
    let lo: number = 0;
    let hi: number = 0.05;
    while (ahead(hi) > 0 && hi < 10) hi *= 1.5;
    if (ahead(hi) > 0)
      throw new Error(`${context.subject}: the throw never comes within reach`);
    for (let i: number = 0; i < 50; i++) {
      const mid: number = (lo + hi) / 2;
      if (ahead(mid) > 0) lo = mid;
      else hi = mid;
    }
    const flight: number = (lo + hi) / 2;
    const meet: IAutoMovieVector3 = throwObject.path(launch, flight);
    const contact: number = released + flight;
    const speed: IAutoMovieVector3 = {
      x: launch.velocity.x,
      y: launch.velocity.y - throwObject.GRAVITY * flight,
      z: launch.velocity.z,
    };
    const along: IAutoMovieVector3 = Vector3.normalize(speed);
    const bones = poseBones(body, resolveHumanPosture(body, standing));
    const shoulders: IAutoMovieVector3 = Vector3.lerp(
      bones.get("leftUpperArm")!.worldPosition,
      bones.get("rightUpperArm")!.worldPosition,
      0.5,
    );
    if (
      Vector3.length(Vector3.subtract(meet, shoulders)) >
      arm + m.hand + m.shoulderHalfWidth
    )
      throw new Error(
        `${context.subject}: the object passes ${Vector3.length(Vector3.subtract(meet, shoulders)).toFixed(2)} m from the shoulders, beyond the arms`,
      );

    // The clock on the catcher's own time, contact at the path's instant.
    const travel: number = AutoMovieMotionHumanTiming.aimed(
      Vector3.length(Vector3.subtract(meet, shoulders)),
      2 * radius,
    );
    const reach: number = Math.max(0, contact - travel);
    if (contact - 0.1 < 0)
      throw new Error(
        `${context.subject}: the catch starts ${(-contact + 0.1).toFixed(2)} s too late to prepare`,
      );
    const secured: number = contact + GIVE_TIME;
    const held: number = secured + 0.4;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      held + 0.6,
      [
        { name: "reach", seconds: reach },
        { name: "prepare", seconds: Math.max(reach, contact - 0.1) },
        { name: "contact", seconds: contact },
        { name: "secured", seconds: secured },
        { name: "held", seconds: held },
      ],
    );
    const duration: number = clock.duration;

    // The object: on its path before contact, given with after it, then
    // carried to before the sternum.
    const given: IAutoMovieVector3 = Vector3.add(meet, Vector3.scale(along, GIVE));
    const object = (seconds: number, posture: IHumanPosture): IAutoMovieVector3 => {
      if (seconds <= contact)
        return throwObject.path(launch, Math.max(0, seconds - released));
      if (seconds <= secured)
        return Vector3.lerp(
          meet,
          given,
          clock.progress("contact", "secured", seconds),
        );
      const sternum = HumanTrunk.region(body, posture, "sternum");
      const before: IAutoMovieVector3 = Vector3.add(
        sternum.point,
        Vector3.scale(sternum.normal, radius + 0.15 * arm),
      );
      return Vector3.lerp(
        given,
        before,
        clock.progress("secured", "held", seconds),
      );
    };

    // Each palm on the object's surface: from the sides with two hands, from
    // behind with one.
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const sides: HumanHand.Side[] =
      (context.params.hands ?? "two") === "two"
        ? ["left", "right"]
        : [context.params.side ?? "right"];
    const hand = (side: HumanHand.Side): IAutoMovieMotionHumanPrimitive => {
      const outward: IAutoMovieVector3 =
        sides.length === 2
          ? Vector3.scale(left, side === "left" ? 1 : -1)
          : along;
      return AutoMovieMotionHumanArm.move({
        body,
        side,
        from: 0,
        to: duration,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          poseBones(body, context.entry.pose),
          {
            origin: context.entry.posture.root,
            yaw: context.entry.posture.yaw,
          },
          side,
          "palm",
        ),
        target: (posture: IHumanPosture, seconds: number) => {
          const centre: IAutoMovieVector3 = object(
            Math.max(seconds, contact),
            posture,
          );
          return AutoMovieMotionHumanTarget.hand(
            body,
            posture,
            side,
            {
              point: Vector3.add(centre, Vector3.scale(outward, radius)),
              normal: outward,
            },
            { surface: "palm", shape: "relaxed", forward: { x: 0, y: 1, z: 0 } },
          );
        },
        weight: (seconds: number): number =>
          minimumJerk(clock.linear("reach", "contact", seconds)).s,
      });
    };

    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "contact",
      primitives: sides.map(hand),
    });
    return {
      ...composed,
      object: (seconds: number): IAutoMovieVector3 =>
        object(seconds, composed.posture(seconds)),
    };
  }
}
