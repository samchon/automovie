import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
import type { IKickGeometry } from "./IKickGeometry";
import { KickForm } from "./KickForm";
import { KickGeometry } from "./KickGeometry";
import { KickRedirect } from "./KickRedirect";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * A kick: the round kick's lower shin or the push kick's ball of the foot
 * brought onto the target, through a chamber, and recoiled to the replant.
 *
 * Effector goals, not keyed angles: the ankle travels on superposed
 * minimum-jerk units from its plant through the chamber to the contact and
 * back through a re-chamber, the knee's bend hint and the foot's rotation
 * riding along, and the engine's limb fit solves the leg. The contact is
 * decided on the fitted figure ({@link KickGeometry}): the two-segment solve
 * ({@link StrikingReach}) puts the lower shin (seven tenths of the way from
 * the knee) or the ball of the foot on the target point with the knee
 * between 5 and 40 degrees of flexion (35 for the push kick), and the body's
 * carriage ({@link KickCarriage}) leans the least that lets the fitted leg
 * hold that solve inside the hip's range of motion. A target nearer than the
 * band is met higher up the shin, as a jammed kick lands; one beyond it,
 * after a step-up of the support foot by up to half a stance, is missed at
 * the fitted leg's own reach. The chamber is the contact's leg with the knee
 * folded ({@link KickChamber}).
 *
 * Both gloves keep their guard (the kick-guard decision of the kickboxing
 * research of #3201).
 *
 * Timing (Gavagan and Sayers 2017): preparation 0.074 s, chamber 14 % and
 * extension 11 % of the 1.02 s execution, recoil 0.65 s; the round kick lands
 * at 0.55 of its peak foot speed. Skill scales chamber and recoil by 1.4 to 1
 * and the strike phase by 1.06 to 1, and the chamber's fold and the pelvis's
 * turn by its range share ({@link StrikingSkill}). Every phase applies to
 * low, body and high kicks alike, an approximation the source states (it
 * timed head kicks).
 *
 * A round kick may be redirected before its chamber key into another round
 * kick ({@link KickRedirect}).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the effector-goal method, where the contact is decided, the body's carriage, the timing with sources and the redirect; {@link KickForm} states which values are provisional.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table admitting only the redirect, parameters with closed technique and leg unions, and a pure plan of postures in world metres and seconds with capsule weapons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the plan type, the leg resolution and the plan the law table, the knee and the defence read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target, accuracy, posture, plan and weapon types; every length comes from the kicking body's measure.
 */
export namespace kick {
  /** The action's name. */
  export const name: HumanActionName = "kick";

  /** Cancel table: a round kick redirects into another until its chamber key. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    kick: [{ window: [0, "chamber"], kind: "redirect", entry: 0 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation Closed unions for the technique and the leg, the interface's motion target, the accuracy union and a feint flag.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan, the defence's telegraph and the kickboxing rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target and accuracy types.
   */
  export interface IParams {
    /** The technique: the round kick with the shin, or the push kick (teep) with the ball of the foot. */
    technique: "round" | "push";

    /** Which leg: the stance's lead or rear; rear for a round kick and lead for a push kick when absent. */
    leg?: "lead" | "rear";

    /** What it strikes. */
    at: AutoMovieMotionTarget;

    /** Declared accuracy; `hit` when absent. */
    accuracy?: StrikingQuality.Accuracy;

    /** A feint: the kick shows its chamber and returns without extending. */
    feint?: boolean;
  }

  /** A kick's plan: a strike's plan that another kick may continue from. */
  export interface IPlan extends StrikingRecord.IPlan {
    /** What a redirect continues. */
    source: IKickGeometry.ISource;
  }

  /**
   * The leg a kick's parameters resolve to.
   *
   * @param params The parameters.
   * @returns Lead or rear.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The parameter's own documentation states the defaults this resolves.
   * @evidence contracts/development/implementation.md#principled-implementation The declared leg, else the rear for a round kick and the lead for a push kick.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leg(params: IParams): "lead" | "rear" {
    return params.leg ?? (params.technique === "round" ? "rear" : "lead");
  }

  /**
   * Plan a kick.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When a redirect's source is not a planned kick, when either kick of a redirect is not a round kick, or when the plan is read back while it is being built.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation Superposed minimum-jerk units carry the ankle through the chamber to the contact goal decided on the fitted figure; the performance's joint contact resolution stops the leg's capsules, after which the chain retraces its approach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Timing first, the geometry built on first use (or continued from the source for a redirect), and every posture, contact window, weapon and record read from it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target beyond the leg's reach is the declared miss at the fitted leg's own reach, not a stretched leg; provisional constants are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One limb fit per lean tried for the contact; per posture, closed-form units plus the display's own fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The geometry is built once per committed stop and dropped on settle, when the stop or the target may have changed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one geometry and its source's, released with the plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IPlan {
    const p: IParams = context.params;

    // A redirect continues its source's clock: the kick's own time zero is
    // the source's, and this instance shows it from the cut on.
    const source: IKickGeometry.ISource | undefined = redirected(context);
    const timing: IKickGeometry.ITiming = source?.timing ?? measure(context);
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
      ...(p.feint === true
        ? []
        : [{ name: "impact", share: share(timing.impact) }]),
      { name: "replant", share: 1 },
    ];

    // A contact resolved jointly by the performance (null: the leg met
    // nothing). A kick that offers its leg as a weapon is shown on its free
    // path until the performance commits its stop, as the joint resolution
    // assumes of every weapon not yet stopped.
    const strikes: boolean =
      p.feint !== true &&
      p.at.kind === "person" &&
      StrikingQuality.stops(p.accuracy);
    let fixed: number | null | undefined = strikes ? null : undefined;
    let built: IKickGeometry | undefined;
    let building: boolean = false;
    const geometry = (): IKickGeometry => {
      if (built !== undefined) return built;
      if (building)
        throw new Error(
          `${context.subject}: the kick was read back while it was being planned`,
        );
      building = true;
      try {
        built =
          source === undefined
            ? KickGeometry.build(context, timing, t0, fixed)
            : KickRedirect.build(context, source, fixed);
      } finally {
        building = false;
      }
      return built;
    };
    return {
      duration,
      events,
      get contacts(): IHumanContactWindow[] {
        return geometry()
          .contacts.map(
            (c: IHumanContactWindow): IHumanContactWindow => ({
              ...c,
              from: share(c.from * timing.duration),
              to: share(c.to * timing.duration),
            }),
          )
          .filter(
            (c: IHumanContactWindow): boolean => c.to > c.from || c.to === 1,
          );
      },
      ...(p.feint === true ? {} : { contact: timing.impact - offset }),
      posture: (seconds: number): IHumanPosture =>
        geometry().posture(
          Math.min(timing.duration, Math.max(0, seconds + offset)),
        ),
      settle: (): void => {
        built = undefined;
      },
      ...(strikes
        ? {
            // The whole leg as three capsules read from the performer's shown
            // bones, which are the free path until the performance commits
            // the stop: the thigh from the hip to the knee, the shank from the
            // knee to the ankle and the foot from the ankle to the ball, so
            // whatever part of the leg first meets a body stops it, and the
            // resolution meets exactly the leg the figure shows.
            weapons: (["thigh", "shin", "foot"] as const).map(
              (id, i: number): IHumanActionPlan.IWeapon => ({
                id,
                limb: timing.side === "left" ? "leftLeg" : "rightLeg",
                radius: [
                  context.body.measure.thighRadius,
                  context.body.measure.shankRadius,
                  KickForm.FOOT_RADIUS_SHARE * context.body.measure.ankleHeight,
                ][i]!,
                from: Math.max(context.start, t0 + timing.prep),
                to: t0 + timing.impact + KickForm.WEAPON_TAIL,
                path: (seconds: number): IAutoMovieVector3 =>
                  shownLeg(context, timing.side, seconds)[i]!,
                tail: (seconds: number): IAutoMovieVector3 =>
                  shownLeg(context, timing.side, seconds)[i + 1]!,
              }),
            ),
            stop: (found: readonly IHumanActionPlan.IContactEvent[]): void => {
              fixed =
                found.length === 0
                  ? null
                  : Math.min(
                      ...found.map(
                        (e: IHumanActionPlan.IContactEvent): number =>
                          e.seconds,
                      ),
                    );
            },
          }
        : {}),
      record: (): StrikingRecord.IRecord => geometry().record,
      source: {
        timing,
        geometry,
        params: p,
        start: t0,
        context: source?.context ?? context,
      },
    };
  }

  /**
   * A performer's shown leg at a film second: the hip, the knee, the ankle
   * and the ball of the foot.
   */
  function shownLeg(
    context: IHumanActionContext<IParams>,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3[] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = context
      .performer(context.subject)
      .bones(seconds);
    const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return [
      bones.get(`${side}UpperLeg`)!.worldPosition,
      bones.get(`${side}LowerLeg`)!.worldPosition,
      foot.worldPosition,
      resolveAutoMovieHumanoidSurfaces.place(
        context.body.surfaces.sockets[
          side === "left" ? "ballLeft" : "ballRight"
        ],
        foot,
      ).point,
    ];
  }

  /** Whether a plan is a kick's, carrying what a redirect continues. */
  function continues(plan: IHumanActionPlan): plan is IPlan {
    return StrikingRecord.carries(plan) && "source" in plan;
  }

  /** The kick a redirect continues, when this instance is one. */
  function redirected(
    context: IHumanActionContext<IParams>,
  ): IKickGeometry.ISource | undefined {
    const from = context.entry.from;

    // Only a cut before the source's chamber key is a redirect: the cancel
    // table admits no other kick-to-kick cut.
    if (from === undefined || from.name !== "kick" || !(from.share < 1 - 1e-9))
      return undefined;
    if (!continues(from.plan))
      throw new Error("A kick redirect needs its source kick's plan");
    const source: IKickGeometry.ISource = from.plan.source;
    if (from.share * source.timing.duration > source.timing.chamber + 1e-9)
      return undefined;
    if (
      source.params.technique !== "round" ||
      context.params.technique !== "round"
    )
      throw new Error("Only a round kick redirects into a round kick");
    return source;
  }

  /** A fresh kick's timing (Gavagan and Sayers 2017 phases, scaled and jittered by skill). */
  function measure(context: IHumanActionContext<IParams>): IKickGeometry.ITiming {
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const side: "left" | "right" =
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
      (context.params.feint === true
        ? 0
        : StrikingSkill.KICK_EXTENSION * StrikingSkill.strike(context.skill));
    const recoil: number =
      context.params.feint === true
        ? chamber - prep
        : StrikingSkill.KICK_RECOIL * slow;
    return { side, lead, prep, chamber, impact, duration: impact + recoil };
  }
}
