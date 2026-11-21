import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanKickBall,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionManner,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLegPhrase } from "../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { HumanBall } from "./HumanBall";

/**
 * Kicking the ball prop lying beside the support foot with the instep, from
 * standing: the kicking leg swings back, then through the ball and on.
 *
 * The goal is the foot on the ball: at `stroke` (contact) the kicking foot's
 * toes' joint, the middle of the instep, meets the back of the ball at its
 * centre's height along the kick's direction, the centre and the radius the
 * ball's own (`HumanBall`), the foot plantarflexed `POINT`
 * degrees so the instep faces the ball (Lees and Nolan 1998, J Sports Sci
 * 16:211; Nunome et al. 2002, Med Sci Sports Exerc 34:2028, compare the
 * instep and side-foot kicks). The backswing draws the foot back and up
 * behind the ball (`CHAMBER`, in shank lengths, provisional), the swing
 * (`AutoMovieMotionHumanLegPhrase.swing`) passes the contact at speed and runs on
 * along its line through the follow-through, and the foot returns to its
 * stance. The opposite arm swings out for balance. The support foot stays
 * planted where it stood, so the ball must lie within the kicking leg's
 * reach of its hip; a farther ball is refused with the reach. Phase lengths
 * are provisional, scaled by the manner's tempo. Events: the phrase's
 * `ready` (`backswing`), `strokeStart`, `stroke` (`contact`), `strokeEnd`
 * (`followThrough`), `relax`.
 *
 * With `speed`, the foot meets the prop at the stroke's film instant and
 * publishes the authored outgoing velocity for that same prop. Both uses
 * retain the planted support foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact goal with sources, the swing, the refusal, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of a leg swing and an arm pulse over a standing base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the contact placement and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball is the scene's prop; the places are shares of the shank.
 */
export namespace kickBall {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "kickBall";

  /** Cancel table: stand or walk after the follow-through. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["strokeEnd", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: ["strokeEnd", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs with their frames and units and the placement returned.
   * @evidence contracts/development/implementation.md#principled-implementation The instep's toe joint meets the ball's back, one radius behind its centre along the kick, the foot headed along the kick and plantarflexed by `POINT` (Lees and Nolan 1998).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pivot placement of the foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The contact is the ball's own surface; nothing is offset by hand.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The foot's pivot about its toe joint is `HumanFoot.pivot`'s.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function contact(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    centre: IAutoMovieVector3,
    radius: number,
    direction: IAutoMovieVector3,
  ): IAutoMovieMotionHumanFoot.IPlacement {
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
   * @throws {HumanRefusal} When the prop declares no sized grip, or the ball lies beyond the kicking leg's reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the swing, the timing and the events.
   * @evidence contracts/development/implementation.md#principled-implementation The contact is the instep on the ball's back, refused beyond the leg's length from the kicking hip; the chamber is behind and above it in shank lengths, and the leg phrase swings the ankle from the stance through the contact to the follow-through.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The ball, the contact, the reach check, the chamber, the clock, the leg swing and the arm pulse over a still standing base.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A ball out of reach is refused with the leg's length, never stretched to; the phase lengths and the arm's angles are named provisional.
   * @evidence contracts/development/implementation.md#efficient-algorithms One standing probe and one placement at plan time; per frame the leg phrase's own work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stand law, `HumanBall`, `HumanFoot.pivot`, the leg phrase and the joint pulse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the contact, the chamber, the stance and the clock.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKickBall.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m = body.measure;
    const side: "left" | "right" = context.params.foot ?? "right";

    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
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
    const speed: number | undefined = context.params.speed;
    const lift: number = context.params.lift ?? 0.3;
    if (speed !== undefined) {
      HumanBound.least("speed", speed, 0, "m/s");
      HumanBound.least("lift", lift, 0, "m/s");
    }
    const strikeAt: number = clock.at("stroke");
    const sampleAt: number =
      context.start + (speed === undefined ? 0 : strikeAt);
    const ballReader: IAutoMovieMotionHumanPropReader = context.prop(
      context.params.ball,
    );
    const ballFrame: IAutoMovieRigidTransform = ballReader.frame(sampleAt);
    const ball: HumanBall.IBall = HumanBall.placed(
      ballReader.prop,
      () => ballFrame,
      "ball",
    );
    const centre: IAutoMovieVector3 = ball.centre;
    const radius: number = ball.radius;
    const heading: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: standing.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const toward: IAutoMovieVector3 =
      context.params.toward === undefined
        ? heading
        : Vector3.subtract(
            context.aim(context.params.toward, sampleAt).point,
            centre,
          );
    const direction: IAutoMovieVector3 = Vector3.normalize({
      x: toward.x,
      y: 0,
      z: toward.z,
    });
    const hit: IAutoMovieMotionHumanFoot.IPlacement = contact(
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
    const chamber: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: Vector3.add(
        hit.ankle,
        Vector3.add(Vector3.scale(direction, -CHAMBER.back * m.shank), {
          x: 0,
          y: CHAMBER.up * m.shank,
          z: 0,
        }),
      ),
      // The shank swings back about the knee from hanging under it at the
      // strike to the chamber, tilting by atan2(back, 1 - up); the foot turns
      // with it, so the ankle keeps the strike's pointed plantarflexion
      // instead of dorsiflexing an unloaded foot on the backswing.
      rotation: HumanFoot.rotation(
        HumanFoot.heading(hit.rotation),
        HumanFoot.pitch(hit.rotation) -
          (Math.atan2(CHAMBER.back, 1 - CHAMBER.up) * 180) / Math.PI,
      ),
    };

    const duration: number = clock.duration;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const stance: IAutoMovieHumanLimbGoal = standing.limbs[`${side}Leg`]!;
    // The body stands under the kick, its sway signed in the kicking side's
    // frame, so a left kick mirrors a right one (`stand.plan`).
    const base: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { seconds: duration } },
      side,
    );
    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        // The kicking foot stands on its stance at the two ends of the swing
        // (`AutoMovieMotionHumanLegPhrase.swing`), so it is planted there:
        // the action after the kick keeps it where it landed.
        base: AutoMovieMotionHumanBase.still(duration, base.posture(0), [
          {
            part: support === "left" ? "leftFoot" : "rightFoot",
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
          ...[0, 1].map(
            (at: number): IAutoMovieMotionHumanContactWindow => ({
              part: side === "left" ? "leftFoot" : "rightFoot",
              kind: "plant",
              from: at,
              to: at,
              support: { kind: "ground" },
            }),
          ),
        ]),
        clock,
        contact: "stroke",
        primitives: [
          AutoMovieMotionHumanLegPhrase.swing({
            body,
            clock,
            side,
            stance: {
              ankle: stance.point,
              rotation: stance.rotation ?? HumanFrame.turn(standing.yaw),
            },
            chamber: (): IAutoMovieMotionHumanFoot.IPlacement => chamber,
            target: (): IAutoMovieMotionHumanFoot.IPlacement => hit,
          }),
          // The opposite arm swings out for balance (provisional angles).
          AutoMovieMotionHumanJoints.pulse(
            clock,
            ["start", "stroke"],
            ["relax", "end"],
            {
              [`${support}UpperArm`]: [10, 40, 0],
            } as IAutoMovieMotionHumanJoints.Angles,
          ),
        ],
      });
    if (speed === undefined) return plan;
    const launch: IAutoMovieMotionPropLaunch = {
      prop: context.params.ball,
      seconds: strikeAt,
      point: ballFrame.position,
      rotation: ballFrame.rotation,
      sphere: {
        radius: ball.radius,
        centre: ballReader.prop.affordances!.find(
          (point) => point.id === "grip",
        )!.frame.translation,
      },
      velocity: {
        x: direction.x * speed,
        y: lift,
        z: direction.z * speed,
      },
    };
    return { ...plan, launches: [...(plan.launches ?? []), launch] };
  }
}
