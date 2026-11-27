import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLegPhrase } from "../../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionManner } from "../../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { hipJoints } from "../../posture/internal/hipJoints";
import type { humanFootOffset } from "../../posture/internal/humanFootOffset";
import { HumanBall } from "../HumanBall";

/**
 * Kicking the ball prop lying beside the support foot with the instep, from
 * standing: the kicking leg swings back, then through the ball and on.
 *
 * The goal is the foot on the ball: at `stroke` (contact) the kicking foot's
 * toes' joint, the middle of the instep, meets the back of the ball at its
 * centre's height along the kick's direction, the centre and the radius the
 * ball's own (`HumanBall`), the foot plantarflexed `POINT` degrees so the
 * instep faces the ball (Lees and Nolan 1998, J Sports Sci 16:211; Nunome et
 * al. 2002, Med Sci Sports Exerc 34:2028, compare the instep and side-foot
 * kicks). The backswing draws the foot back and up behind the ball (`CHAMBER`,
 * in shank lengths, provisional), the swing
 * (`AutoMovieMotionHumanLegPhrase.swing`) passes the contact at speed and runs
 * on through the follow-through along the leg's arc about the hip, at the
 * swing's own angular rate, so the leg keeps its length and the knee its bend
 * instead of locking straight on a placement past reach; with no hold, the knee
 * flexes as the foot returns to its stance. The opposite arm swings out for
 * balance. The support foot stays planted where it stood, so the ball must lie
 * within the kicking leg's reach of its hip; a farther ball is refused with the
 * reach. Phase lengths are provisional, scaled by the manner's tempo. Events:
 * the phrase's `ready` (`backswing`), `strokeStart`, `stroke` (`contact`),
 * `strokeEnd` (`followThrough`), `relax`.
 *
 * With `speed`, the foot meets the prop at the stroke's film instant and
 * publishes the authored outgoing velocity for that same prop. Both uses retain
 * the planted support foot.
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

  /**
   * The backswing's ankle place behind and above the contact, in shank lengths
   * (provisional).
   */
  export const CHAMBER: Readonly<ICHAMBERItem> = {
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
    body: humanFootOffset.IBody,
    side: AutoMovieHumanSide,
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
   * @throws {HumanRefusal} When the prop declares no sized grip, or the ball
   *   lies beyond the kicking leg's reach.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKickBall.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m = body.measure;
    const side: AutoMovieHumanSide = context.params.foot ?? "right";

    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { hold: 1 } })
      .posture(0);
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: 0.35,
        attack: 0.1,
        follow: 0.15,
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
      context.params.target === undefined
        ? heading
        : Vector3.subtract(
            context.aim(context.params.target, sampleAt).point,
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

    // The swing's turn about the hip from the chamber to the contact, the
    // angle the follow-through goes on turning at, and its axis.
    const back: IAutoMovieVector3 = Vector3.subtract(chamber.ankle, hip);
    const front: IAutoMovieVector3 = Vector3.subtract(hit.ankle, hip);
    const lateral: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(back, front),
    );
    const swept: number =
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            Vector3.dot(back, front) /
              (Vector3.length(back) * Vector3.length(front)),
          ),
        ),
      ) *
        180) /
      Math.PI;
    const duration: number = clock.duration;
    const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const stance: IAutoMovieHumanLimbGoal = standing.limbs[`${side}Leg`]!;
    // The body stands under the kick, its sway signed in the kicking side's
    // frame, so a left kick mirrors a right one (`stand.plan`).
    const base: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { hold: duration } },
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
            target: (
              _posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieMotionHumanFoot.IPlacement => {
              // Past the contact the swing reads its placement on the line
              // from the chamber through this target at its overshoot
              // progress p; the target is set so that point lies on the
              // leg's arc about the hip, turned on by the swing's own angle
              // per unit of progress.
              const p: number = AutoMovieMotionClock.through(
                clock,
                ["strokeStart", "stroke", "strokeEnd"],
                seconds,
              );
              if (p <= 1) return hit;
              const arc: IAutoMovieVector3 = Vector3.add(
                hip,
                Quaternion.rotateVector(
                  Quaternion.fromAxisAngle(lateral, swept * (p - 1)),
                  Vector3.subtract(hit.ankle, hip),
                ),
              );
              // On the way back the knee flexes and the shank swings back as
              // it did into the chamber, so the foot turns toward the
              // chamber's pointed foot with it and the unloaded ankle keeps
              // its plantarflexion.
              return {
                ankle: Vector3.add(
                  chamber.ankle,
                  Vector3.scale(Vector3.subtract(arc, chamber.ankle), 1 / p),
                ),
                rotation: Quaternion.slerp(
                  hit.rotation,
                  chamber.rotation,
                  clock.progress("relax", "end", seconds),
                ),
              };
            },
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

/** The record of `ICHAMBERItem`'s site. */
type ICHAMBERItem = { back: number; up: number };
