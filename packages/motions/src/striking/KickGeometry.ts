import {
  Vector3,
  minimumJerk,
  type superposeMinimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import type { IKickGeometry } from "./IKickGeometry";
import { KickCarriage } from "./KickCarriage";
import type { KickChain } from "./KickChain";
import { KickChamber } from "./KickChamber";
import { KickContact } from "./KickContact";
import { KickForm } from "./KickForm";
import { KickPlans } from "./KickPlans";
import { KickSwing } from "./KickSwing";
import { StrikingAim } from "./StrikingAim";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";
import type { kick } from "./kick";

/**
 * Builds a kick's geometry.
 *
 * The contact is decided first, on the figure itself ({@link KickContact}):
 * the carriage under which the fitted leg lands its weapon on the planned
 * point with the support foot on its plant. The displayed contact goal is
 * then that fitted leg (its ankle, its knee and its foot rotation), so the
 * figure shows exactly what was judged, and the chamber is the same leg with
 * the knee folded ({@link KickChamber}).
 *
 * Between its plant, the chamber and the contact the leg travels on the path
 * {@link KickSwing} carries with the pelvis. Each online correction of the
 * target's point ({@link StrikingAim}) is a whole plan of its own, and the
 * figure moves from plan to plan ({@link KickPlans}).
 */
export namespace KickGeometry {
  /**
   * Build a kick's geometry.
   *
   * @param context The kick's context, its entry being the kick's own start.
   * @param timing The kick's timing.
   * @param t0 Film second of the kick's time zero.
   * @param fixed The contact second the performance committed: null when the leg met nothing, undefined when the kick offers no weapon.
   * @param kept What a redirect keeps of its source; a fresh kick reads its own line and steps up when short.
   * @returns The geometry.
   */
  export function build(
    context: IHumanActionContext<kick.IParams>,
    timing: IKickGeometry.ITiming,
    t0: number,
    fixed: number | null | undefined,
    kept?: IKickGeometry.IKept,
  ): IKickGeometry {
    const p: kick.IParams = context.params;
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const { side, prep, impact } = timing;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const entry: IHumanPosture = context.entry.posture;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const round: boolean = p.technique === "round";
    const feint: boolean = p.feint === true;

    // Where the target is, and the range a standing target is read at: the
    // leg's comfortable length for the push kick, and for the round kick the
    // horizontal reach of the lower shin at the target's height.
    const aim = (seconds: number): IAutoMovieVector3 =>
      StrikingTarget.aim(context, p.at, seconds, (height: number): number =>
        round
          ? 0.5 * m.hipHalfWidth +
            Math.sqrt(
              Math.max(
                0,
                (KickForm.RANGE_SHARE *
                  (m.thigh + KickForm.SHIN_SHARE * m.shank)) **
                  2 -
                  (height - m.hipHeight) ** 2,
              ),
            )
          : KickForm.RANGE_SHARE * (m.thigh + m.shank),
      );
    const first: IAutoMovieVector3 = aim(t0 - StrikingTarget.LOOK);
    const line: IAutoMovieVector3 =
      kept?.line ?? StrikingTarget.line(entry.root, first, entry.yaw);
    const outward: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, line),
      side === "left" ? 1 : -1,
    );
    const level: "low" | "middle" | "high" = band(body, first);
    const amplitude: number = StrikingSkill.amplitude(context.skill);
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);

    // The round kick's pelvis turns until the target lies the band's azimuth
    // to the kicking side of its forward; the push kick tips back instead.
    const turn: number = round
      ? wrapDegrees(
          StrikingTarget.heading(line) +
            (side === "right" ? 1 : -1) * KickForm.AZIMUTH[level] -
            entry.yaw,
        ) * amplitude
      : 0;
    const pitch: number = round ? 0 : -KickForm.PUSH_PITCH * amplitude;
    const direction: IAutoMovieVector3 = round
      ? Vector3.normalize(
          Vector3.add(
            Vector3.add(
              Vector3.scale(outward, -KickForm.TRAVEL.across),
              Vector3.scale(line, KickForm.TRAVEL.along),
            ),
            Vector3.scale(up, KickForm.TRAVEL.vertical[level]),
          ),
        )
      : line;
    const offset: IAutoMovieVector3 = StrikingQuality.offset({
      skill: context.skill,
      random: context.random("scatter"),
      ...(p.accuracy === undefined ? {} : { accuracy: p.accuracy }),
      direction,
      radius: m.shankRadius,
      distance: Vector3.length(Vector3.subtract(first, feet[side].ankle)),
      seconds: impact - prep,
    });
    const tracker: StrikingAim.ITracker = StrikingAim.track(
      aim,
      {
        launch: t0 - StrikingTarget.LOOK,
        impact: t0 + impact,
        latency: StrikingSkill.CORRECTION_LATENCY,
        step: KickForm.TRACK_STEP,
        shortest: KickForm.TRACK_SHORTEST,
      },
      offset,
    );

    // The contact, decided on the fitted figure, and the chamber folded from
    // it by the skill's range share.
    const props: KickCarriage.IProps = {
      body,
      entry,
      feet,
      side,
      line,
      timing,
      amplitude,
    };
    const origin: IAutoMovieVector3 = feet[side].ankle;
    const knee: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
      `${side}LowerLeg` as AutoMovieHumanoidBone,
    )!.worldPosition;

    // One goal's plan: its contact, the chamber folded from it, and the leg's
    // path. A feint ends on the chamber, and a kick that lands opens the knee
    // from it onto the fitted contact leg, arriving with its share of the
    // opening's peak speed.
    const plan = (
      goal: IAutoMovieVector3,
      decided: number | undefined,
      prefer?: number,
    ): IPlanned => {
      const found: KickContact.IContact = KickContact.choose(
        props,
        { body, side, technique: p.technique, line, direction, planned: goal },
        { turn, pitch },
        decided,
        prefer,
      );
      const fit: KickChain.IFit = found.fit;
      const folded: number =
        fit.flexion + (KickForm.CHAMBER_FLEXION - fit.flexion) * amplitude;
      const key: KickChamber.IKey = KickChamber.fold(
        body,
        side,
        fit.pose,
        folded,
      );
      return {
        goal,
        carriage: found.carriage,
        fit,
        leg: KickSwing.create({
          body,
          side,
          timing,
          base: found.base,
          key,
          contact: feint
            ? key
            : { knee: fit.knee, ankle: fit.ankle, rotation: fit.rotation },
          flexion: {
            chamber: folded,
            contact: feint ? folded : fit.flexion,
            least: KickForm.FLEXION[p.technique][0],
          },
          speed: feint
            ? 1
            : round
              ? StrikingSkill.IMPACT_SPEED_SHARE.kick
              : KickForm.PUSH_SPEED_SHARE,
          plant: { knee, ankle: origin, rotation: feet[side].rotation },
          step: Vector3.scale(line, found.carriage.step),
        }),
      };
    };

    // The launch's plan decides the step; every correction of the aim is a
    // plan of its own on that step, trying the lean it corrects first. A
    // feint throws at nothing, so it follows nothing.
    const launched: IPlanned = plan(
      tracker.planned,
      kept?.step ?? (feint ? 0 : undefined),
    );
    const carriage: IKickGeometry.ICarriage = launched.carriage;
    const fit: KickChain.IFit = launched.fit;
    const plans: KickPlans.IPlans = KickPlans.create({
      first: launched,
      next: (previous: KickPlans.IPlan, goal: IAutoMovieVector3): IPlanned =>
        plan(goal, carriage.step, previous.carriage.lean),
      units: (seconds: number): readonly superposeMinimumJerk.IUnit[] =>
        feint ? [] : tracker.units(seconds),
      t0,
    });
    return compose(body, timing, t0, {
      line,
      carriage,
      base: (
        seconds: number,
        shown: IKickGeometry.ICarriage,
        turning?: number,
      ): IHumanPosture => KickCarriage.posture(props, shown, seconds, turning),
      shown: plans.shown,
      leg: plans.leg,
      origin,
      back: Vector3.add(origin, Vector3.scale(line, carriage.step)),
      contacts: windows(timing, side, support, carriage.step > 0),
      record: {
        offset,
        planned: tracker.planned,
        reached: fit.reached,
        status: fit.status,

        // The stop is the performance's joint resolution of the leg's
        // capsules; the kick scans nothing itself.
        stop: (seconds: number): number | undefined =>
          fixed !== undefined && fixed !== null && fixed <= seconds
            ? fixed
            : undefined,
      },
    });
  }

  /**
   * Assemble the posture from the body, the kicking leg and the guard.
   *
   * When the leg meets a surface, the whole striking chain (the pelvis's
   * turn and lean, and the leg under it) holds for the dwell and then
   * withdraws along the way it came: the kick's own approach played
   * backwards from the stop to its start on a minimum-jerk clock, so it
   * leaves at rest and arrives at rest. Every configuration of the approach
   * up to the stop was clear of the body it met (the stop is the first
   * contact), so retracing it never passes the knee or the shin through that
   * body, wherever the contact was. The support foot's step-up stops where
   * the contact found it, so the retraced body stands on the same foot it
   * approached on, and the kicking foot replants by the share of the step
   * the support foot had made.
   *
   * @param body The kicking body.
   * @param timing The kick's timing.
   * @param t0 Film second of the kick's time zero.
   * @param parts The geometry's parts.
   * @returns The geometry with its posture.
   */
  export function compose(
    body: IHumanBody,
    timing: IKickGeometry.ITiming,
    t0: number,
    parts: Omit<IKickGeometry, "posture">,
  ): IKickGeometry {
    const ball: IAutoMovieVector3 = HumanFoot.offset(body, timing.side, "ball");
    const chain = (t: number): IHeld => {
      const at: number | undefined = parts.record.stop(t0 + t);
      const s: number | undefined = at === undefined ? undefined : at - t0;
      if (s === undefined || t <= s) {
        const base: IHumanPosture = parts.base(t, parts.shown(t));
        return { body: base, leg: parts.leg(t, base, { x: 0, y: 0, z: 0 }) };
      }

      // The approach clock runs back from the stop to the start over the
      // rest of the kick, after the dwell, while the step's clock stays at
      // the stop.
      const rest: number = Math.max(
        1e-3,
        timing.duration - s - StrikingStroke.DWELL,
      );
      const w: number = minimumJerk((t - s - StrikingStroke.DWELL) / rest).s;
      const back: number = s * (1 - w);
      const stepped: number = minimumJerk(
        (s - timing.prep) / Math.max(1e-3, timing.chamber - timing.prep),
      ).s;
      const base: IHumanPosture = parts.base(s, parts.shown(back), back);
      return {
        body: base,
        leg: parts.leg(
          back,
          base,
          Vector3.scale(Vector3.subtract(parts.back, parts.origin), stepped * w),
        ),
      };
    };
    return {
      ...parts,
      posture: (t: number): IHumanPosture => {
        const held: IHeld = chain(t);
        const down: boolean = t <= timing.prep || t >= timing.duration - 1e-9;
        return {
          ...held.body,
          limbs: {
            ...held.body.limbs,
            ...StrikingStance.guard(body, held.body, { lead: timing.lead }),
            [timing.side === "left" ? "leftLeg" : "rightLeg"]: {
              point: held.leg.ankle,
              bend: held.leg.hint,
              rotation: held.leg.rotation,
              ...(down ? { planted: true, contact: ball } : {}),
            },
          },
        };
      },
    };
  }

  /** The body and the kicking leg's goal at one instant. */
  interface IHeld {
    /** The body's posture without the kicking leg's goal. */
    body: IHumanPosture;

    /** The kicking leg's goal. */
    leg: IKickGeometry.ILeg;
  }

  /** One goal's plan with the leg its contact fitted. */
  interface IPlanned extends KickPlans.IPlan {
    /** The fitted contact leg. */
    fit: KickChain.IFit;
  }

  /** The height band of a target point against a body's own heights, the floor at zero. */
  function band(
    body: IHumanBody,
    point: IAutoMovieVector3,
  ): "low" | "middle" | "high" {
    if (point.y < body.measure.waistHeight * KickForm.BAND.low) return "low";
    if (point.y < body.measure.shoulderHeight * KickForm.BAND.middle)
      return "middle";
    return "high";
  }

  /**
   * The feet's contact windows, as shares of the kick's duration: the
   * kicking foot is planted until the launch and at the replant, and the
   * support foot pivots on its ball throughout, except while it slides a
   * step-up between the launch and the chamber key.
   */
  function windows(
    timing: IKickGeometry.ITiming,
    side: "left" | "right",
    support: "left" | "right",
    stepped: boolean,
  ): IHumanContactWindow[] {
    const d: number = timing.duration;
    const pivot = (from: number, to: number): IHumanContactWindow => ({
      part: `${support}Foot`,
      kind: "pivot",
      from,
      to,
      support: { kind: "ground" },
    });
    return [
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: timing.prep / d,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 1,
        to: 1,
        support: { kind: "ground" },
      },
      ...(stepped
        ? [pivot(0, timing.prep / d), pivot(timing.chamber / d, 1)]
        : [pivot(0, 1)]),
    ];
  }
}
