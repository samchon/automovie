import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { DefenceOutcome } from "./DefenceOutcome";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { defendGeometry } from "./defendGeometry";
import type { kick } from "./kick";
import type { punch } from "./punch";

/**
 * A defence against one placed strike: a glove, forearm or shin brought to
 * where the incoming weapon will be, or the head moved off its line.
 *
 * When the defence starts comes from the defence outcome law
 * ({@link DefenceOutcome}): the defender reacts to the strike's launch after a
 * seeded reaction time, earlier by the anticipation lead the strike's
 * preparation allows (its telegraph), and the author may force the outcome
 * (in time, late or fail), which the law realises with plausible timing.
 * Where it goes comes from what the defender sees at that start: the
 * attacker's moving limb (the hand or foot whose velocity points most toward
 * the struck region) and the line from it to the region on the defender's own
 * body. Nothing about contact is decided here: the strike stops on the first
 * surface it meets, so an in-time cover is struck on the glove, a late one is
 * struck through, and a slip that moved the head off the line in time is
 * missed (the strike's tracking cannot follow a move that starts within one
 * correction latency of its contact).
 *
 * Kinds (IBA coaching manual pp. 57 to 67; kickboxing research of #3201,
 * defence table):
 *
 * - `cover`: the glove on the attacked side over the attacked head region,
 *   palm toward the incoming line, elbow down (both gloves for a central
 *   region).
 * - `parry`: the glove opposite the punching hand meets the fist on the line
 *   a forearm's length ahead of the region and turns it aside.
 * - `elbowBlock`: the elbow on the attacked side dropped over the attacked
 *   body region, the glove kept at the jaw.
 * - `highBlock`: the forearm on the attacked side braced beside the head,
 *   the glove above the temple.
 * - `slip`: the head moved off the line by its own radius, the fist's and a
 *   margin, through the knees and a trunk lean, outside the punching arm.
 * - `roll`: the head dropped under the line by two head radii through bent
 *   knees and a forward lean, then up.
 * - `sway`: the upper body leaned back over the rear foot until the head
 *   clears the line.
 * - `check`: the leg on the attacked side lifted, knee up and out, shin
 *   turned into the kick, the foot dorsiflexed (the toes-up variant).
 *
 * The defence holds until just after the strike's contact and returns to the
 * guard over one hand recovery. The geometry itself is built by
 * {@link defendGeometry} on the first posture after the read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the defence starts, where it goes, each kind with its coaching source, and that contact is left to the strike.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters with a closed union of kinds, and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the plan, and the telegraph and decision queries the outcome law's audits and tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, placed-action and outcome types; the strike is named by its anchor, not by a production's scene.
 */
export namespace defend {
  /** The action's name. */
  export const name: HumanActionName = "defend";

  /** Cancel table: a defence flows into a counter punch or another defence once the strike has passed. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    punch: [
      { window: ["contact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
    defend: [
      { window: ["contact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the kind, the answered strike's anchor and the outcome's default.
   * @evidence contracts/development/design.md#principled-representation A closed union of defence kinds, the strike as its anchor (checked when planning to strike this performer) and an optional forced outcome.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the outcome union.
   */
  export interface IParams {
    /** The defence. */
    kind:
      | "cover"
      | "parry"
      | "elbowBlock"
      | "highBlock"
      | "slip"
      | "roll"
      | "sway"
      | "check";

    /** The anchor of the strike it answers. */
    against: string;

    /** The forced outcome; drawn from the defender's skill when absent. */
    outcome?: DefenceOutcome.Outcome;
  }

  /**
   * How much of a strike its preparation shows, in [0, 1]: provisional
   * readings of how visible each technique's preparation is, with no
   * located study measuring it per technique. A round kick's chamber shows
   * most (1.0), a push kick or knee 0.8, a rear-hand punch's turn 0.6 and a
   * jab 0.4.
   *
   * @param attack The placed strike.
   * @returns The telegraph.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the range, each technique's value and that the values are provisional for want of a study.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup of the provisional visibility by technique and hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per strike family.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The placed strike's parameters are read through the strike laws' own parameter types, by its action name; values are named provisional readings.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function telegraph(attack: IHumanActionContext.IPlaced): number {
    if (attack.name === "kick")
      return (attack.params as kick.IParams).technique === "round" ? 1 : 0.8;
    if (attack.name === "punch") {
      const p: punch.IParams = attack.params as punch.IParams;
      return p.technique === "straight" && (p.hand ?? "lead") === "lead"
        ? 0.4
        : 0.6;
    }
    return 0.8;
  }

  /** Every planned defence's decision, for audits. */
  const DECISIONS: WeakMap<IHumanActionPlan, DefenceOutcome.IDecision> =
    new WeakMap();

  /**
   * The outcome decision of a planned defence.
   *
   * @param plan A defence's plan.
   * @returns Its decision, or undefined for another action's plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the meaning of undefined.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup in the weak map the plan registered its decision in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads a stored decision.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Decisions are keyed weakly by their plans, so each is released with its plan.
   */
  export function decision(
    plan: IHumanActionPlan,
  ): DefenceOutcome.IDecision | undefined {
    return DECISIONS.get(plan);
  }

  /**
   * Plan a defence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the answered strike has no contact or shown peak, or does not strike this performer at a region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The outcome law times the start from the strike's launch and contact; the goal is built from what the defender sees at that read second, the guard held before it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Decides the timing once, builds the geometry on first use after the read, and evaluates each posture from it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A strike that cannot be defended throws; nothing about contact is decided here, so no outcome is faked geometrically.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The decision is made once per plan and the geometry built once, dropped on settle when the strike may have changed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one geometry, cleared by settle, and one decision keyed weakly by the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const attack: IHumanActionContext.IPlaced = context.action(p.against);

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
      throw new Error(
        `${p.against} has no contact or shown peak to defend against`,
      );
    const at = (
      attack.params as {
        at?: {
          kind: string;
          subject?: string;
          region?: AutoMovieHumanoidRegion;
        };
      }
    ).at;
    if (
      at === undefined ||
      at.kind !== "person" ||
      at.subject !== context.subject ||
      at.region === undefined
    )
      throw new Error(`${p.against} does not strike ${context.subject}`);
    const region: AutoMovieHumanoidRegion = at.region;
    const launch: number =
      attack.start +
      (attack.plan.events.find((e) => e.name === "launch")?.share ?? 0) *
        attack.plan.duration;
    const hit: number = attack.start + decisive;
    const movement: number = StrikingSkill.defence(context.skill);
    const decided: DefenceOutcome.IDecision = DefenceOutcome.decide(
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
    // Before the read the defender only holds the guard, and nothing reads
    // the attacker: every read of another performer then looks back in time,
    // so two performers reading each other never recurse at one instant.
    let built: defendGeometry.IGeometry | undefined;
    let building: boolean = false;
    const geometry = (): defendGeometry.IGeometry => {
      if (built !== undefined) return built;
      if (building)
        throw new Error(
          `${context.subject}: the defence against ${p.against} was read back while it was being planned`,
        );
      building = true;
      try {
        built = defendGeometry.build(context, timing);
      } finally {
        building = false;
      }
      return built;
    };
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const contacts: IHumanContactWindow[] = defendGeometry.windows(
      p.kind === "check" ? defendGeometry.attacked(region, lead) : undefined,
      timing,
    );
    const out: IHumanActionPlan = {
      duration,
      events,
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return t <= begin + 1e-9 ? idle(context, lead) : geometry().posture(t);
      },
      settle: (): void => {
        built = undefined;
      },
    };
    DECISIONS.set(out, decided);
    return out;
  }

  /** The guard held while waiting for the read: the entry's feet planted and the gloves up. */
  function idle(
    context: IHumanActionContext<IParams>,
    lead: "left" | "right",
  ): IHumanPosture {
    const entry: IHumanPosture = context.entry.posture;
    const posture: IHumanPosture = {
      ...entry,
      joints: { ...entry.joints, ...StrikingStance.joints() },
      limbs: StrikingStance.legs(
        context.body,
        StrikingTarget.feet(context.entry),
      ),
    };
    return {
      ...posture,
      limbs: {
        ...posture.limbs,
        ...StrikingStance.guard(context.body, posture, { lead }),
      },
    };
  }
}
