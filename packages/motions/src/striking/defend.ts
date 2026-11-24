import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDefenceOutcome,
  IAutoMovieMotionHumanDefend,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { DefenceOutcome } from "./DefenceOutcome";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { defendFootwork } from "./defendFootwork";
import { defendGeometry } from "./defendGeometry";
import { strikingReadBack } from "./strikingReadBack";

/** The record of `IPlanAt`'s site. */
type IPlanAt = {
  at?: IPlanAtAt;
};

/** The record of `IPlanAtAt`'s site. */
type IPlanAtAt = {
  kind: string;
  subject?: string;
  region?: AutoMovieHumanoidRegion;
};

/**
 * A defence against one placed strike: a glove, forearm or shin brought to
 * where the incoming weapon will be, or the head moved off its line.
 *
 * When the defence starts comes from the defence outcome law
 * ({@link DefenceOutcome}): the defender reacts to the strike's launch after a
 * seeded reaction time, earlier by the anticipation lead the strike's
 * preparation allows (its telegraph), and the author may force the outcome (in
 * time, late or fail), which the law realises with plausible timing. Where it
 * goes comes from what the defender sees at that start: the attacker's moving
 * limb (the hand or foot whose velocity points most toward the struck region)
 * and the line from it to the region on the defender's own body. Nothing about
 * contact is decided here: the strike stops on the first surface it meets, so
 * an in-time cover is struck on the glove, a late one is struck through, and a
 * slip that moved the head off the line in time is missed (the strike's
 * tracking cannot follow a move that starts within one correction latency of
 * its contact).
 *
 * Kinds (IBA coaching manual pp. 57 to 67; kickboxing research, defence table):
 *
 * - `cover`: the glove on the attacked side over the attacked head region, palm
 *   toward the incoming line, elbow down (both gloves for a central region).
 * - `parry`: the glove opposite the punching hand meets the fist on the line a
 *   forearm's length ahead of the region and turns it aside.
 * - `elbowBlock`: the elbow on the attacked side dropped over the attacked body
 *   region, the glove kept at the jaw.
 * - `highBlock`: the forearm on the attacked side braced beside the head, the
 *   glove above the temple.
 * - `slip`: the head moved off the line by its own radius, the fist's and a
 *   margin, through the knees and a trunk lean, outside the punching arm.
 * - `roll`: the head dropped under the line by two head radii through bent knees
 *   and a forward lean, then up.
 * - `sway`: the upper body leaned back over the rear foot until the head clears
 *   the line.
 * - `check`: the leg on the attacked side lifted, knee up and out, shin turned
 *   into the kick, the foot dorsiflexed (the toes-up variant).
 *
 * The defence holds until just after the strike's contact and returns to the
 * guard over one hand recovery. The geometry itself is built by
 * {@link defendGeometry} on the first posture after the read.
 */
export namespace defend {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "defend";

  /**
   * Cancel table: a defence flows into a counter punch or another defence once
   * the strike has passed.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    punch: [
      { window: ["contact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
    defend: [
      { window: ["contact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /**
   * How much of a strike its preparation shows, in [0, 1]: provisional readings
   * of how visible each technique's preparation is, with no located study
   * measuring it per technique. A round kick's chamber shows most (1.0), a push
   * kick or knee 0.8, a rear-hand punch's turn 0.6 and a jab 0.4.
   *
   * @param attack The placed strike.
   * @returns The telegraph.
   */
  export function telegraph(attack: IAutoMovieMotionHumanPlacedAction): number {
    if (attack.family === "kick")
      return (attack.params as IAutoMovieMotionHumanKick.IParams).technique ===
        "round"
        ? 1
        : 0.8;
    if (attack.family === "punch") {
      const p: IAutoMovieMotionHumanPunch.IParams =
        attack.params as IAutoMovieMotionHumanPunch.IParams;
      return p.technique === "straight" && (p.hand ?? "lead") === "lead"
        ? 0.4
        : 0.6;
    }
    return 0.8;
  }

  /**
   * Plan a defence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the answered strike has no contact or shown
   *   peak, does not strike this performer at a region, or the forced outcome
   *   is one plausible timing cannot meet (`DefenceOutcome.decide`).
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDefend.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanDefend.IParams = context.params;
    const attack: IAutoMovieMotionHumanPlacedAction = context.action(p.against);

    // A feint has no contact: the defender bites on the moment the strike it
    // shows would have landed, which the feint declares, and which is how a
    // defence spent on the feint leaves the real strike open. A strike that
    // declares neither is read at its shown peak.
    const shown: number | undefined = attack.plan.events.find(
      (e) => e.name === "shown" || e.name === "chamber",
    )?.share;
    const decisive: number | undefined =
      attack.plan.contact ??
      attack.plan.feigned ??
      (shown === undefined ? undefined : shown * attack.plan.duration);
    if (decisive === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "against",
        value: p.against,
        reason: `${p.against} has no contact or shown peak to defend against`,
        fix: "defend against the anchor of a strike that lands or is shown",
      });
    const at = (attack.params as IPlanAt).at;
    if (
      at === undefined ||
      at.kind !== "person" ||
      at.subject !== context.subject ||
      at.region === undefined
    )
      throw new HumanRefusal({
        kind: "participant",
        axis: "against",
        value: p.against,
        reason: `${p.against} does not strike ${context.subject}`,
        fix: "name the anchor of a strike aimed at this performer",
      });
    const region: AutoMovieHumanoidRegion = at.region;
    const launch: number =
      attack.start +
      (attack.plan.events.find((e) => e.name === "launch")?.share ?? 0) *
        attack.plan.duration;
    const hit: number = attack.start + decisive;
    const movement: number = StrikingSkill.defence(context.skill);
    const decided: IAutoMovieMotionHumanDefenceOutcome.IDecision =
      DefenceOutcome.decide(
        {
          launch,
          hit,
          telegraph: telegraph(attack),
          movement,
          skill: context.skill,
        },
        context.random("defence"),
        p.outcome,
      );
    const begin: number = Math.max(0, decided.start - context.start);
    const contact: number = hit - context.start;
    const hold: number = Math.max(begin + movement, contact + 0.05);
    const recovery: number =
      StrikingSkill.HAND_RECOVERY * StrikingSkill.recovery(context.skill);
    const duration: number = hold + recovery;
    const events: IAutoMovieMotionEvent[] = [
      { name: "read", share: begin / duration },
      { name: "set", share: Math.min(1, (begin + movement) / duration) },
      { name: "contact", share: Math.min(1, Math.max(0, contact / duration)) },
      { name: "recovered", share: 1 },
    ];
    const timing: defendGeometry.ITiming = {
      region,
      attack,
      begin,
      movement,
      hold,
      recovery,
      duration,
      read: Math.max(context.start, decided.start),
    };
    const lead: AutoMovieHumanSide = StrikingTarget.lead(context.entry);
    const checking: AutoMovieHumanSide | undefined =
      p.kind === "check" ? defendGeometry.attacked(region, lead) : undefined;
    const support: defendFootwork.ISupport | undefined = defendFootwork(
      context,
      timing,
      checking,
    );
    // Before the read the defender only holds the guard, and nothing reads
    // the attacker: every read of another performer then looks back in time,
    // so two performers reading each other never recurse at one instant.
    let built: defendGeometry.IGeometry | undefined;
    let building: boolean = false;
    const geometry = (): defendGeometry.IGeometry => {
      if (built !== undefined) return built;
      if (building) throw strikingReadBack("defend", context.subject);
      building = true;
      try {
        built = defendGeometry.build(context, timing, support);
      } finally {
        building = false;
      }
      return built;
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] =
      defendGeometry.windows(checking, timing, support);
    const waiting: IAutoMovieMotionHumanActionPlan["posture"] = idle(
      context,
      lead,
      support,
    );
    const out: IAutoMovieMotionHumanActionPlan = {
      duration,
      events,
      contacts,
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return t <= begin + 1e-9
          ? waiting(t, channels, resolution, projection)
          : geometry().posture(t, channels, resolution, projection);
      },
      settle: (): void => {
        built = undefined;
      },
    };
    return out;
  }

  /**
   * Fixed entry-foot and guard demands while waiting; each query still resolves
   * its complete current authored posture.
   */
  function idle(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDefend.IParams>,
    lead: AutoMovieHumanSide,
    support: defendFootwork.ISupport | undefined,
  ): IAutoMovieMotionHumanActionPlan["posture"] {
    const legs: ReturnType<typeof StrikingStance.prepareLegs> =
      StrikingStance.prepareLegs(
        context.body,
        StrikingTarget.feet(context.entry),
      );
    const guard: ReturnType<typeof StrikingStance.prepareGuard> =
      StrikingStance.prepareGuard(context.body, { lead });
    return (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
      const posture: IAutoMovieMotionHumanPosture = {
        ...entry,
        joints: { ...entry.joints, ...StrikingStance.joints(entry.joints) },
        limbs: support?.legs(seconds) ?? legs(),
      };
      return {
        ...posture,
        limbs: { ...posture.limbs, ...guard(posture, resolution, projection) },
      };
    };
  }
}
