import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";

/**
 * Kicking a ball lying beside the support foot with the instep, from
 * standing: the kicking leg swings back, then through the ball and on.
 *
 * The goal is the foot on the ball: at `stroke` (contact) the kicking foot's
 * toes' joint, the middle of the instep, meets the back of the ball at its
 * centre's height along the kick's direction, the foot plantarflexed `POINT`
 * degrees so the instep faces the ball (Lees and Nolan 1998, J Sports Sci
 * 16:211; Nunome et al. 2002, Med Sci Sports Exerc 34:2028, compare the
 * instep and side-foot kicks). The backswing draws the foot back and up
 * behind the ball (`CHAMBER`, in shank lengths, provisional), the swing
 * (`AutoMovieMotionHumanLeg.swing`) passes the contact at speed and runs on
 * along its line through the follow-through, and the foot returns to its
 * stance. The opposite arm swings out for balance. The support foot stays
 * planted where it stood, so the ball must lie within the kicking leg's
 * reach of its hip; a farther ball is refused with the reach. Phase lengths
 * are provisional, scaled by the manner's tempo. Events: the phrase's
 * `ready` (`backswing`), `strokeStart`, `stroke` (`contact`), `strokeEnd`
 * (`followThrough`), `relax`.
 *
 * Not yet: the approach run-up at 30 to 45 degrees and the support foot's
 * plant step beside the ball, the side-foot and toe kicks, the ball's launch
 * (A4), a moving ball, and striking a ball with a held implement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact goal with sources, the swing, the refusal, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of a leg swing and an arm pulse over a standing base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the contact placement and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball is a target; the places are shares of the shank.
 */
export namespace kickBall {
  /** The action's name. */
  export const name: HumanActionName = "kickBall";

  /** Cancel table: stand or walk after the follow-through. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["strokeEnd", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["strokeEnd", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The ball, its size, the kicking foot and the direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball is a target.
   */
  export interface IParams {
    /** The ball's centre. */
    ball: AutoMovieMotionTarget;

    /** The ball's radius, metres; 0.11 when absent (a size 5 football). */
    radius?: number;

    /** The kicking foot; `right` when absent. */
    foot?: "left" | "right";

    /** Where the ball is kicked toward; along the heading when absent. */
    toward?: AutoMovieMotionTarget;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The foot's plantarflexion at contact, degrees (provisional). */
  export const POINT: number = 50;

  /** The backswing's ankle place behind and above the contact, in shank lengths (provisional). */
  export const CHAMBER: Readonly<{ back: number; up: number }> = {
    back: 0.7,
    up: 0.6,
  };

  /**
   * The kicking foot's placement at contact.
   *
   * @param body The body.
   * @param side The kicking foot.
   * @param centre The ball's centre, world metres.
   * @param radius The ball's radius, metres.
   * @param direction The kick's horizontal unit direction.
   * @returns The placement.
   */
  export function contact(
    body: IHumanBody,
    side: "left" | "right",
    centre: IAutoMovieVector3,
    radius: number,
    direction: IAutoMovieVector3,
  ): HumanFoot.IPlacement {
    return HumanFoot.pivot(
      body,
      side,
      "mtp",
      Vector3.subtract(centre, Vector3.scale(direction, radius)),
      (Math.atan2(direction.x, direction.z) * 180) / Math.PI,
      -POINT,
    );
  }

  /**
   * Plan a kick.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the ball lies beyond the kicking leg's reach.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m = body.measure;
    const side: "left" | "right" = context.params.foot ?? "right";
    const radius: number = context.params.radius ?? 0.11;
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const standing: IHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const centre: IAutoMovieVector3 = context.aim(
      context.params.ball,
      context.start,
    ).point;
    const heading: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: standing.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const toward: IAutoMovieVector3 =
      context.params.toward === undefined
        ? heading
        : Vector3.subtract(
            context.aim(context.params.toward, context.start).point,
            centre,
          );
    const direction: IAutoMovieVector3 = Vector3.normalize({
      x: toward.x,
      y: 0,
      z: toward.z,
    });
    const hit: HumanFoot.IPlacement = contact(
      body,
      side,
      centre,
      radius,
      direction,
    );
    const hip: IAutoMovieVector3 = hipJoints(
      body,
      standing.root,
      HumanFrame.turn(standing.yaw),
    )[side];
    const leg: number = m.thigh + m.shank;
    if (Vector3.length(Vector3.subtract(hit.ankle, hip)) > leg)
      throw new HumanRefusal({
        kind: "reach",
        axis: "ball",
        value: Vector3.length(Vector3.subtract(hit.ankle, hip)),
        feasible: { kind: "range", minimum: 0, maximum: leg, unit: "m" },
        reason: `the ball's back lies ${Vector3.length(Vector3.subtract(hit.ankle, hip)).toFixed(2)} m from the kicking hip, beyond the leg's ${leg.toFixed(2)} m`,
        fix: "stand nearer the ball (approach it) so that its back lies within the leg's length of the kicking hip",
      });
    const chamber: HumanFoot.IPlacement = {
      ankle: Vector3.add(
        hit.ankle,
        Vector3.add(Vector3.scale(direction, -CHAMBER.back * m.shank), {
          x: 0,
          y: CHAMBER.up * m.shank,
          z: 0,
        }),
      ),
      rotation: hit.rotation,
    };

    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: 0.35,
        attack: 0.1,
        follow: 0.15,
        hold: 0.1,
        retract: 0.45,
      }),
      modifiers,
      { fixed: ["strokeStart", "stroke"] },
    );
    const duration: number = clock.duration;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const stance: IHumanPosture.IGoal = standing.limbs[`${side}Leg`]!;
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, base.posture(0), [
        {
          part: support === "left" ? "leftFoot" : "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
      ]),
      clock,
      contact: "stroke",
      primitives: [
        AutoMovieMotionHumanLeg.swing({
          body,
          clock,
          side,
          stance: {
            ankle: stance.point,
            rotation: stance.rotation ?? HumanFrame.turn(standing.yaw),
          },
          chamber: (): HumanFoot.IPlacement => chamber,
          target: (): HumanFoot.IPlacement => hit,
        }),
        // The opposite arm swings out for balance (provisional angles).
        AutoMovieMotionHumanJoints.pulse(
          clock,
          ["start", "stroke"],
          ["relax", "end"],
          {
            [`${support}UpperArm`]: [10, 40, 0],
          } as AutoMovieMotionHumanJoints.Angles,
        ),
      ],
    });
  }
}
