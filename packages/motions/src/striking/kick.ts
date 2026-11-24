import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieMotionWeaponContact,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSkill } from "../skill/HumanSkill";
import { KickClear } from "./KickClear";
import { KickGeometry } from "./KickGeometry";
import { KickLaunch } from "./KickLaunch";
import { KickRedirect } from "./KickRedirect";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingRide } from "./StrikingRide";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingWeapon } from "./StrikingWeapon";
import { StrikingWeaponTable } from "./StrikingWeaponTable";
import { strikingReadBack } from "./strikingReadBack";

/** The alternatives of `PlanLimb`'s site. */
type PlanLimb = "leftLeg" | "rightLeg";

/** The alternatives of `LegResult`'s site. */
type LegResult = "lead" | "rear";

/**
 * A kick: the round kick's lower shin or the push kick's ball of the foot
 * brought onto the target, through a chamber, and recoiled to the replant.
 *
 * Effector goals, not keyed angles: the ankle travels on superposed
 * minimum-jerk units from its plant through the chamber to the contact and back
 * through a re-chamber, the knee's bend hint and the foot's rotation riding
 * along, and the engine's limb fit solves the leg. The contact is decided on
 * the fitted figure ({@link KickGeometry}): the two-segment solve
 * ({@link StrikingReach}) puts the lower shin (seven tenths of the way from the
 * knee) or the ball of the foot on the target point with the knee between 5 and
 * 40 degrees of flexion (35 for the push kick), and the body's carriage
 * ({@link KickCarriage}) leans the least that lets the fitted leg hold that
 * solve inside the hip's range of motion. A target nearer than the band is met
 * higher up the shin, as a jammed kick lands; one beyond it, after a step-up of
 * the support foot by up to half a stance, is missed at the fitted leg's own
 * reach. The chamber is the contact's leg with the knee folded
 * ({@link KickChamber}).
 *
 * Both gloves keep their guard (the kick-guard decision of the kickboxing
 * research).
 *
 * Timing (Gavagan and Sayers 2017): preparation 0.074 s, chamber 14 % and
 * extension 11 % of the 1.02 s execution, recoil 0.65 s; the round kick lands
 * at 0.55 of its peak foot speed. Skill scales chamber and recoil by 1.4 to 1
 * and the strike phase by 1.06 to 1, and the chamber's fold and the pelvis's
 * turn by its range share ({@link StrikingSkill}). Every phase applies to low,
 * body and high kicks alike, an approximation the source states (it timed head
 * kicks).
 *
 * A round kick may be redirected before its chamber key into another round kick
 * ({@link KickRedirect}).
 */
export namespace kick {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "kick";

  /** Cancel table: a round kick redirects into another until its chamber key. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    kick: [{ window: [0, "chamber"], kind: "redirect", entry: 0 }],
  };

  /**
   * The leg a kick's parameters resolve to.
   *
   * @param params The parameters.
   * @returns Lead or rear.
   */
  export function leg(params: IAutoMovieMotionHumanKick.IParams): LegResult {
    return params.leg ?? (params.technique === "round" ? "rear" : "lead");
  }

  /**
   * Plan a kick.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When a redirect's source is not a planned kick, when either
   *   kick of a redirect is not a round kick, when the plan is read back while
   *   it is being built, or when a feint's share lies outside (0, 1) or past
   *   the chamber's share.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
  ): IAutoMovieMotionHumanKick.IPlan {
    const p: IAutoMovieMotionHumanKick.IParams = context.params;
    if (p.feint !== undefined && !(p.feint > 0 && p.feint < 1))
      throw new Error("A feint shows a share of the delivery in (0, 1)");

    // A redirect continues its source's clock: the kick's own time zero is
    // the source's, and this instance shows it from the cut on.
    const source: IAutoMovieMotionHumanKickGeometry.ISource | undefined =
      redirected(context);
    const timing: IAutoMovieMotionHumanKickGeometry.ITiming =
      source?.timing ?? measure(context);

    // A feint shows the chamber, the share of the committed delivery its
    // chamber takes (a feint's timing ends on the chamber, so the committed
    // extension is added back); a share past it would need a partial
    // extension the kick does not have, so it is refused, never clamped.
    if (p.feint !== undefined) {
      const chamberShare: number =
        timing.chamber /
        (timing.chamber +
          StrikingSkill.KICK_EXTENSION * StrikingSkill.strike(context.skill));
      if (p.feint > chamberShare + 1e-9)
        throw new Error(
          `A kick feint shows its chamber: a share up to ${chamberShare.toFixed(3)}`,
        );
    }
    const t0: number = source?.start ?? context.start;
    const offset: number = context.start - t0;
    const duration: number = timing.duration - offset;
    const share = (seconds: number): number =>
      Math.min(1, Math.max(0, (seconds - offset) / duration));
    const events: IAutoMovieMotionEvent[] = [
      ...(timing.prep >= offset
        ? [{ name: "launch", share: share(timing.prep) }]
        : []),
      ...(timing.chamber >= offset
        ? [{ name: "chamber", share: share(timing.chamber) }]
        : []),
      ...(p.feint !== undefined
        ? []
        : [{ name: "impact", share: share(timing.impact) }]),
      { name: "replant", share: 1 },
    ];

    // A contact resolved jointly by the performance (null: the leg met
    // nothing). A kick that offers its leg as a weapon is shown on its free
    // path until the performance commits its stop, as the joint resolution
    // assumes of every weapon not yet stopped.
    const strikes: boolean =
      p.feint === undefined &&
      p.at.kind === "person" &&
      StrikingQuality.stops(p.accuracy);
    let fixed: number | null | undefined = strikes ? null : undefined;

    // The whole leg as three capsules fitted on the kick's free course, which
    // is what the figure shows until the performance commits the stop
    // (`StrikingWeapon.leg`): the thigh from the hip to the knee, the shank
    // from the knee to the ankle and the foot from the ankle to the ball,
    // each tapered between the girths at its joints, so whatever part of the
    // leg first meets a body stops it, and the resolution meets the leg the
    // figure shows.
    const limb: PlanLimb = timing.side === "left" ? "leftLeg" : "rightLeg";
    const course: StrikingWeapon.Course = (
      at: number,
      channels?: Parameters<StrikingWeapon.Course>[1],
      resolution?: Parameters<StrikingWeapon.Course>[2],
      projection?: Parameters<StrikingWeapon.Course>[3],
    ): IAutoMovieMotionHumanPosture =>
      geometry().posture(
        Math.min(timing.duration, Math.max(0, at - t0)),
        channels,
        resolution,
        projection?.(),
      );
    const frames: ReturnType<typeof StrikingWeapon.frames> =
      StrikingWeapon.frames(context.body, limb);
    const chain: StrikingWeapon.IChain = {
      ids: ["thigh", "shin", "foot"],
      limb,
      radii: StrikingWeapon.legRadii(context.body),
      from: Math.max(context.start, t0 + timing.prep),
      to: t0 + timing.impact + StrikingWeapon.TAIL,
      ends: (seconds: number): IAutoMovieVector3[] =>
        StrikingWeapon.leg(
          context.body,
          course,
          timing.side,
          seconds,
          undefined,
          undefined,
          frames,
        ),
      read: StrikingWeaponTable.reader(
        (
          seconds: number,
          near: Parameters<typeof StrikingWeapon.leg>[4],
          kept: NonNullable<Parameters<typeof StrikingWeapon.leg>[5]>,
        ): IAutoMovieVector3[] =>
          StrikingWeapon.leg(
            context.body,
            course,
            timing.side,
            seconds,
            near,
            kept,
            frames,
          ),
      ),
      on: (): object => geometry(),
    };

    // The contact the performance committed, and the stopped leg's ride on
    // the body it met ({@link StrikingRide}), built on first use.
    let met: IAutoMovieMotionWeaponContact | null = null;
    let ride: StrikingRide.IRide | undefined;
    const carried = (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      if (met === null) return posture;
      const event: IAutoMovieMotionWeaponContact = met;
      ride ??= StrikingRide.create({
        other: (): IAutoMovieMotionHumanPerformerReader =>
          context.performer(event.against),
        stop: event.seconds,
        goal: (at: number): IAutoMovieVector3 =>
          geometry().posture(at - t0).limbs[limb]!.point,
        axis: (at: number): readonly [IAutoMovieVector3, IAutoMovieVector3] =>
          StrikingWeapon.axis(chain, event.weapon, at),
      });
      return ride.carry(posture, limb, t0 + seconds);
    };
    let built: IAutoMovieMotionHumanKickGeometry | undefined;
    let building: boolean = false;

    // What the kick fixed at its launch (`KickLaunch`): made once for the
    // plan, and again only when a settle shows the launch's own reading of
    // the target changed. The geometry, which follows the partner as shown
    // and the committed stop, is built on it at every settle.
    let launched: KickLaunch.ILaunch | undefined;
    const geometry = (): IAutoMovieMotionHumanKickGeometry => {
      if (built !== undefined) return built;
      if (building) throw strikingReadBack("kick", context.subject);
      building = true;
      try {
        const made: KickLaunch.ILaunch =
          source === undefined
            ? KickLaunch(context, timing, t0, undefined, launched)
            : KickRedirect.launch(context, source, launched);

        // A new launch's way to its contact is cleared of the person
        // kicked at once (`KickClear`); the launch kept is the cleared one.
        launched =
          made === launched ? made : KickClear(context, timing, t0, made);
        built =
          source === undefined
            ? KickGeometry.build(context, timing, t0, fixed, launched)
            : KickRedirect.build(context, source, fixed, launched);
      } finally {
        building = false;
      }
      return built;
    };
    return {
      duration,
      events,
      get contacts(): IAutoMovieMotionHumanContactWindow[] {
        return geometry()
          .contacts.map(
            (
              c: IAutoMovieMotionHumanContactWindow,
            ): IAutoMovieMotionHumanContactWindow => ({
              ...c,
              from: share(c.from * timing.duration),
              to: share(c.to * timing.duration),
            }),
          )
          .filter(
            (c: IAutoMovieMotionHumanContactWindow): boolean =>
              c.to > c.from || c.to === 1,
          );
      },
      // A feint's chamber is the committed kick's, so the contact it
      // pretends is one extension past its chamber key.
      ...(p.feint !== undefined
        ? {
            feigned:
              timing.chamber +
              StrikingSkill.KICK_EXTENSION *
                StrikingSkill.strike(context.skill) -
              offset,
          }
        : { contact: timing.impact - offset }),
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(
          timing.duration,
          Math.max(0, seconds + offset),
        );
        return carried(geometry().posture(t, undefined, source, projection), t);
      },
      prepare: (): void => {
        built = undefined;
        ride = undefined;
        geometry();
      },
      ...(strikes
        ? {
            weapons: StrikingWeapon.capsules(chain),
            stop: (found: readonly IAutoMovieMotionWeaponContact[]): void => {
              met = StrikingWeapon.first(found);
              fixed = met === null ? null : met.seconds;
              ride = undefined;

              // The geometry is built on the stop it was given: a stop
              // committed now makes it another, whoever settles after.
              built = undefined;
            },
          }
        : {}),
      record: (): IAutoMovieMotionHumanStrikingRecord.IRecord =>
        geometry().record,
      source: {
        timing,
        geometry,
        params: p,
        start: t0,
        context: source?.context ?? context,
      },
    };
  }

  /** Whether a plan is a kick's, carrying what a redirect continues. */
  function continues(
    plan: IAutoMovieMotionHumanActionPlan,
  ): plan is IAutoMovieMotionHumanKick.IPlan {
    return StrikingRecord.carries(plan) && "source" in plan;
  }

  /** The kick a redirect continues, when this instance is one. */
  function redirected(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
  ): IAutoMovieMotionHumanKickGeometry.ISource | undefined {
    const from = context.entry.from;

    // Only a cut before the source's chamber key is a redirect: the cancel
    // table admits no other kick-to-kick cut.
    if (
      from === undefined ||
      from.family !== "kick" ||
      !(from.share < 1 - 1e-9)
    )
      return undefined;
    if (!continues(from.plan))
      throw new Error("A kick redirect needs its source kick's plan");
    const source: IAutoMovieMotionHumanKickGeometry.ISource = from.plan.source;
    if (from.share * source.timing.duration > source.timing.chamber + 1e-9)
      return undefined;
    if (
      source.params.technique !== "round" ||
      context.params.technique !== "round"
    )
      throw new Error("Only a round kick redirects into a round kick");
    return source;
  }

  /**
   * A fresh kick's timing (Gavagan and Sayers 2017 phases, scaled and jittered
   * by skill).
   */
  function measure(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKick.IParams>,
  ): IAutoMovieMotionHumanKickGeometry.ITiming {
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const side: AutoMovieHumanSide =
      leg(context.params) === "lead" ? lead : StrikingStance.rear({ lead });
    const slow: number = StrikingSkill.recovery(context.skill);
    const prep: number = StrikingSkill.KICK_PREPARATION;
    const chamber: number =
      prep +
      HumanSkill.jitter(
        context.skill,
        context.random("chamber"),
        StrikingSkill.KICK_CHAMBER * slow,
      );
    const impact: number =
      chamber +
      (context.params.feint !== undefined
        ? 0
        : StrikingSkill.KICK_EXTENSION * StrikingSkill.strike(context.skill));
    const recoil: number =
      context.params.feint !== undefined
        ? chamber - prep
        : StrikingSkill.KICK_RECOIL * slow;
    return { side, lead, prep, chamber, impact, duration: impact + recoil };
  }
}
