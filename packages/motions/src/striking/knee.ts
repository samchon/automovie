import {
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KickCarriage } from "./KickCarriage";
import { KickForm } from "./KickForm";
import { KneeForm } from "./KneeForm";
import { KneeReach } from "./KneeReach";
import { StrikingBody } from "./StrikingBody";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingRide } from "./StrikingRide";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";

/**
 * A knee strike: the knee driven up and forward onto the target while the
 * hands hold the opponent's head or neck (the clinch) or stay at the guard.
 *
 * The knee is the weapon, and the thigh carries it on a circle about the hip
 * ({@link KneeReach}). The hips square to the thigh's heading, the support
 * foot pivoting on its ball with them; the pelvis travels along the line
 * until the knee's front is on the target, lowered as far as the planted
 * support leg needs to keep its foot, and the knee is solved from the hip
 * that carriage leaves it. A target outside the thigh's range or the pelvis's
 * travel is the declared miss at maximum reach (`short`), and one closer than
 * the hips can withdraw is `jammed`: the knee lands where it first meets the
 * body.
 *
 * The knee is lifted, then the hips are driven in
 * ({@link KneeForm.LIFT_SHARE}): the thigh swings about the hip from where
 * the stance had it to its solved elevation on an early clock, the pelvis
 * travels on a late one, and the way back mirrors it. The shank folds under
 * the knee and the toes point down along it ({@link KneeForm.FLEXION},
 * {@link KneeForm.PLANTAR}), so the foot trails behind the knee instead of
 * leading it into the opponent's legs. The trunk leans back slightly to keep
 * the centre of mass over the pivoting support foot.
 *
 * The thigh, the shank and the foot are offered to the performance's joint
 * contact resolution as capsules on the shown leg ({@link StrikingWeapon}),
 * so the knee stops where any part of the leg first meets the other body; it
 * holds for the contact dwell, gives way before the body it rests on
 * ({@link StrikingRide}), and withdraws along the way it came, as the kick
 * does.
 *
 * Timing (kickboxing research of #3201): the knee rises through the round
 * kick's chamber only, so it lands at the chamber key (preparation 0.074 s
 * plus 14 % of the 1.02 s execution) and recoils over the kick's 0.65 s;
 * skill scales them like the kick's. With a person target, the hands reach
 * either side of the other's nape for the clinch; GLORY allows one knee per
 * clinch, which the kickboxing rules check.
 */
export namespace knee {
  /** The action's name. */
  export const name: HumanActionName = "knee";

  /** Cancel table: none; a knee runs to its replant. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The interface's motion target and a closed union of legs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan and the kickboxing rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** What it strikes. */
    at: AutoMovieMotionTarget;

    /** Which leg: lead or rear; rear when absent. */
    leg?: "lead" | "rear";
  }

  /** The thigh's and the shank's unit directions, world frame. */
  interface ILeg {
    /** From the hip to the knee. */
    thigh: IAutoMovieVector3;

    /** From the knee to the ankle. */
    shank: IAutoMovieVector3;
  }

  /** A plan's solved knee with the course it is reached on. */
  interface IGeometry extends KneeReach.ISolution {
    /** The target point, world metres. */
    target: IAutoMovieVector3;

    /** The hips' turn to the thigh's heading, degrees. */
    turn: number;

    /** The leg as the stance has it. */
    from: ILeg;

    /** The leg at the contact. */
    to: ILeg;

    /**
     * What the stance's planted ankle lies from the ankle `from` puts under
     * the stance's hip, world metres: zero unless the stance stretches the
     * leg past its length.
     */
    slack: IAutoMovieVector3;

    /** The driven foot's world rotation at the contact. */
    foot: IAutoMovieQuaternion;
  }

  /**
   * Plan a knee strike.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const side: "left" | "right" =
      (p.leg ?? "rear") === "lead" ? lead : StrikingStance.rear({ lead });
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const slow: number = StrikingSkill.recovery(context.skill);
    const prep: number = StrikingSkill.KICK_PREPARATION;
    const impact: number = prep + StrikingSkill.KICK_CHAMBER * slow;
    const duration: number = impact + StrikingSkill.KICK_RECOIL * slow;
    const span: number = impact - prep;
    const recoil: number = duration - impact;
    const entry: IHumanPosture = context.entry.posture;
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const t0: number = context.start;
    const leg: "leftLeg" | "rightLeg" =
      side === "left" ? "leftLeg" : "rightLeg";

    // The body without the driven leg: the hips squared and the trunk leaned
    // by `whole`, the pelvis travelled by `drive`, the support foot turning
    // on its ball with the hips so the support hip keeps its twist, and the
    // root lowered until the planted support leg reaches its foot.
    const carriage = (
      thrust: IAutoMovieVector3,
      turn: number,
      whole: number,
      drive: number,
    ): IHumanPosture => {
      const supportFoot: HumanFoot.IPlacement = StrikingTarget.pivot(
        body,
        support,
        feet[support],
        turn * whole,
        KneeForm.HEEL_RAISE * whole,
      );
      return resolveHumanPosture.lower(
        body,
        {
          root: Vector3.add(entry.root, Vector3.scale(thrust, drive)),
          yaw: entry.yaw + turn * whole,
          pitch: entry.pitch - KneeForm.LEAN * whole,
          roll: entry.roll,
          joints: StrikingStance.facing(
            { ...entry.joints, ...StrikingStance.joints() },
            turn * whole,
          ),
          limbs: StrikingStance.legs(
            body,
            side === "left"
              ? { left: feet.left, right: supportFoot }
              : { left: supportFoot, right: feet.right },
            { left: side !== "left", right: side !== "right" },
          ),
        },
        5,
      );
    };

    // The solve from the hip as the squared, travelled and lowered pelvis
    // carries it: the hips turn to the thigh's heading (a bladed stance turns
    // them away from the target, and the thigh cannot point across the pelvis
    // within the hip's range), so the heading is found from the entry hip and
    // the knee solved again from the hip each solved carriage leaves.
    let built: IGeometry | undefined;
    const geometry = (): IGeometry => {
      if (built !== undefined) return built;
      const target: IAutoMovieVector3 = StrikingTarget.aim(
        context,
        p.at,
        t0 - StrikingTarget.LOOK,
        (): number => 0.8 * m.thigh,
      );
      const line: IAutoMovieVector3 = StrikingTarget.line(
        entry.root,
        target,
        entry.yaw,
      );
      const patella: number = Vector3.length(
        body.surfaces.regions[side === "left" ? "kneeLeft" : "kneeRight"].point,
      );
      const travel: number =
        KneeForm.TRAVEL[p.leg ?? "rear"] * StrikingStance.length(body);
      const reach = (hip: IAutoMovieVector3): KneeReach.ISolution =>
        KneeReach.solve(hip, target, m.thigh, patella, m.shank, travel, line);
      const start: IAutoMovieVector3 = KickCarriage.hip(
        body,
        carriage({ x: 0, y: 0, z: 0 }, 0, 0, 0),
        side,
      );
      let hip: IAutoMovieVector3 = start;
      let solved: KneeReach.ISolution = reach(hip);
      const turn: number = wrapDegrees(
        StrikingTarget.heading(solved.heading) - entry.yaw,
      );
      for (let round: number = 0; round < KneeForm.ROUNDS; round++) {
        hip = Vector3.subtract(
          KickCarriage.hip(body, carriage(solved.thrust, turn, 1, 1), side),
          solved.thrust,
        );
        solved = reach(hip);
      }

      // The stance's leg under the stance's hip, and the contact's.
      const rest: IAutoMovieVector3 = feet[side].ankle;
      const bent: IAutoMovieVector3 = KneeReach.bent(
        start,
        rest,
        m.thigh,
        m.shank,
        line,
      );
      const from: ILeg = {
        thigh: Vector3.normalize(Vector3.subtract(bent, start)),
        shank: Vector3.normalize(Vector3.subtract(rest, bent)),
      };
      const to: ILeg = {
        thigh: Vector3.normalize(
          Vector3.subtract(solved.knee, Vector3.add(hip, solved.thrust)),
        ),
        shank: Vector3.normalize(Vector3.subtract(solved.ankle, solved.knee)),
      };
      const axes = KneeReach.foot(to.shank, solved.heading);
      built = {
        ...solved,
        target,
        turn,
        from,
        to,
        slack: Vector3.subtract(
          rest,
          Vector3.add(
            start,
            Vector3.add(
              Vector3.scale(from.thigh, m.thigh),
              Vector3.scale(from.shank, m.shank),
            ),
          ),
        ),
        foot: StrikingBody.foot(axes.toes, axes.instep),
      };
      return built;
    };
    const events: IAutoMovieMotionEvent[] = [
      { name: "launch", share: prep / duration },
      { name: "impact", share: impact / duration },
      { name: "replant", share: 1 },
    ];
    const contacts: IHumanContactWindow[] = [
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: prep / duration,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 1,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: `${support}Foot`,
        kind: "pivot",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];

    // The knee on its free course at a clock second (as if it met nothing),
    // the clinching hands reading the other's nape at the film second.
    const free = (clock: number, seconds: number): IHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, clock));
      const g: IGeometry = geometry();

      // The hips square over the whole way out and back; the thigh lifts
      // early and lowers late; the pelvis drives late and withdraws early.
      const lift: number = KneeForm.LIFT_SHARE * span;
      const lower: number = KneeForm.LIFT_SHARE * recoil;
      const whole: number =
        minimumJerk((t - prep) / span).s - minimumJerk((t - impact) / recoil).s;
      const rise: number =
        minimumJerk((t - prep) / lift).s -
        minimumJerk((t - (duration - lower)) / lower).s;
      const drive: number =
        minimumJerk((t - (impact - lift)) / lift).s -
        minimumJerk((t - impact) / lower).s;
      const posture: IHumanPosture = carriage(g.thrust, g.turn, whole, drive);

      // The thigh swung about the hip the carriage leaves, the shank folding
      // under it, and the stance's slack given back as the leg lifts.
      const joint: IAutoMovieVector3 = Vector3.add(
        KickCarriage.hip(body, posture, side),
        Vector3.scale(KneeReach.swing(g.from.thigh, g.to.thigh, rise), m.thigh),
      );
      const ankle: IAutoMovieVector3 = Vector3.add(
        Vector3.add(
          joint,
          Vector3.scale(
            KneeReach.swing(g.from.shank, g.to.shank, rise),
            m.shank,
          ),
        ),
        Vector3.scale(g.slack, 1 - rise),
      );
      const hands = StrikingStance.guard(body, posture, { lead });
      if (p.at.kind === "person") {
        const other: IHumanActionContext.IPerformer = context.performer(
          p.at.subject,
        );
        const nape: IAutoMovieVector3 = other
          .bones(seconds - StrikingTarget.LOOK)
          .get("neck")!.worldPosition;
        const lateral: IAutoMovieVector3 = Vector3.cross(up, g.heading);
        const aside: number =
          KneeForm.CLINCH_SHARE * other.body.measure.shoulderHalfWidth;
        for (const arm of ["leftArm", "rightArm"] as const) {
          const g0: IHumanPosture.IGoal | undefined = hands[arm];
          if (g0 === undefined) continue;
          const hold: IAutoMovieVector3 = Vector3.add(
            Vector3.add(nape, Vector3.scale(g.heading, KneeForm.CLINCH_DEPTH)),
            Vector3.scale(lateral, arm === "leftArm" ? aside : -aside),
          );
          hands[arm] = {
            ...g0,
            point: Vector3.lerp(g0.point, hold, Math.min(1, 2 * whole)),
          };
        }
      }
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...hands,
          [leg]: {
            point: ankle,
            bend: Vector3.add(joint, Vector3.scale(g.heading, 0.1)),
            rotation: Quaternion.slerp(feet[side].rotation, g.foot, rise),
            ...(t <= prep || t >= duration - 1e-9 ? { planted: true } : {}),
          },
        },
      };
    };

    // The knee's contact is the performance's joint resolution of the leg's
    // capsules (null: it met nothing); until it is committed the knee is shown
    // on its free course, as the resolution assumes.
    let fixed: number | null = null;
    const stop = (seconds: number): number | undefined =>
      fixed !== null && fixed <= seconds ? fixed : undefined;

    // The shown leg as capsules tapered between the girths at its joints:
    // the thigh, the shank and the foot.
    const chain: StrikingWeapon.IChain = {
      ids: ["thigh", "shin", "foot"],
      limb: leg,
      radii: StrikingWeapon.legRadii(context.body),
      from: t0 + prep,
      to: t0 + impact + KickForm.WEAPON_TAIL,
      ends: (seconds: number): IAutoMovieVector3[] =>
        StrikingWeapon.leg(context, side, seconds),
    };

    // The contact the performance committed, and the stopped leg's ride on
    // the body it met ({@link StrikingRide}), built on first use.
    let met: IHumanActionPlan.IContactEvent | null = null;
    let ride: StrikingRide.IRide | undefined;
    const carried = (
      posture: IHumanPosture,
      seconds: number,
    ): IHumanPosture => {
      if (met === null) return posture;
      const event: IHumanActionPlan.IContactEvent = met;
      ride ??= StrikingRide.create({
        other: (): IHumanActionContext.IPerformer =>
          context.performer(event.against),
        stop: event.seconds,
        goal: (at: number): IAutoMovieVector3 =>
          free(at - t0, at).limbs[leg]!.point,
        axis: (at: number): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
          StrikingWeapon.axis(chain, event.weapon, at),
      });
      return ride.carry(posture, leg, t0 + seconds);
    };
    const out: IHumanActionPlan = {
      duration,
      events,
      contacts,
      contact: impact,
      settle: (): void => {
        built = undefined;
        ride = undefined;
      },
      ...(p.at.kind === "person"
        ? {
            weapons: StrikingWeapon.capsules(chain),
            stop: (found: readonly IHumanActionPlan.IContactEvent[]): void => {
              met = StrikingWeapon.first(found);
              fixed = met === null ? null : met.seconds;
              ride = undefined;
            },
          }
        : {}),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const at: number | undefined = stop(t0 + t);
        if (at === undefined || t <= at - t0) return free(t, t0 + t);

        // Held for the dwell, then the free course played back from the stop
        // to the start on a minimum-jerk clock: the way in was clear of the
        // body up to its first contact, so the way out is too. The clinch
        // lets go at the contact: the hands withdraw from where the nape was
        // at the stop, since the struck body reels out of the arms' reach.
        const s: number = at - t0;
        const w: number = minimumJerk(
          (t - s - StrikingStroke.DWELL) /
            Math.max(1e-3, duration - s - StrikingStroke.DWELL),
        ).s;
        return carried(free(s * (1 - w), at), t);
      },
    };
    StrikingRecord.register(out, (): StrikingRecord.IRecord => {
      // The knee's front where the shown leg puts it at the planned impact,
      // with the solve's own status.
      const g: IGeometry = geometry();
      const bones = context.performer(context.subject).bones(t0 + impact);
      const reached: IAutoMovieVector3 = StrikingBody.region(
        body,
        bones,
        side === "left" ? "kneeLeft" : "kneeRight",
      ).point;
      return {
        limb: side === "left" ? "leftFoot" : "rightFoot",
        offset: { x: 0, y: 0, z: 0 },
        planned: g.target,
        reached,
        status: g.status,
        stop,
      };
    });
    return out;
  }
}
