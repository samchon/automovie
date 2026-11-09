import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { BodyFrame } from "../../laws/body/BodyFrame";
import { DuelLaw } from "../../laws/duelling/DuelLaw";
import { StageAction } from "../../laws/staging/StageAction";
import type { IStageWorld } from "../staging/IStageWorld";

/**
 * Every spell of the film from its cast to its end, decided rule-first: the
 * duel law's outcome table reads the spell, the defender's answer that meets
 * it (a deflection whose sweep lands while the streak is in flight, or a
 * shield standing when it arrives) and the casting distance; geometry then
 * draws it. A streak leaves the wand tip at the cast's contact and flies at
 * 5 m/s: deflected, it turns at the defender's wand toward the deflection's
 * target or the floor ahead and flies on; blocked, it ends on the shield;
 * otherwise it ends at its aim. Each end is an impact a consequence can read,
 * such as the cracked fillet's.
 *
 * ```ts
 * const spells = SpellTrack.resolve(world, schedule);
 * spells.streaks; // segments with times, points and colours
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md#deflection A watched streak is deflectable when its travel covers reaction plus sweep; it leaves up to 60° away.
 * @evidence docs/research/duelling/practice-duel.md#outcomes Deflected, hit, blocked, disarmed.
 * @evidence docs/body/settings/world/magic.md#practice-only Blue-white jinx and scarlet disarming streaks at 5 ± 1 m/s; the shield stops spells.
 * @evidence docs/body/settings/world/magic.md#deflection A deflected jinx keeps its effect where it lands.
 * @evidence contracts/development/behaviors.md#relational-goals The outcome comes from the paired intents by the table first; geometry follows.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Resolved once from the schedule.
 * @evidence contracts/development/common.md#meaningful-documentation States the rules and outputs.
 */
export namespace SpellTrack {
  /** One straight flight of a streak. */
  export interface IStreak {
    /** The cast's anchor or index id. */
    id: string;

    /** Spell. */
    spell: "jinx" | "disarm" | "levitate";

    /** Start second and point. */
    start: number;
    from: IAutoMovieVector3;

    /** End second and point. */
    end: number;
    to: IAutoMovieVector3;
  }

  /** Where a streak ended. */
  export interface IImpact {
    /** Second. */
    at: number;

    /** World point. */
    point: IAutoMovieVector3;

    /** Spell. */
    spell: "jinx" | "disarm" | "levitate";

    /** Outcome class. */
    outcome: DuelLaw.Outcome;
  }

  /** The resolved spells. */
  export interface ITrack {
    streaks: IStreak[];
    impacts: IImpact[];
  }

  /**
   * Resolve every cast of a schedule.
   *
   * @param world The world.
   * @param schedule The schedule.
   * @returns Streaks and impacts.
   */
  export function resolve(world: IStageWorld, schedule: IAutoMovieSchedule): ITrack {
    const streaks: IStreak[] = [];
    const impacts: IImpact[] = [];
    for (const e of schedule.entries) {
      if (e.intent.capability !== "cast" || e.contact === undefined) continue;
      const action = StageAction.read(e.intent) as Extract<StageAction.Action, { kind: "cast" }>;
      const step = e.state as IStageWorld.IStudentStep;
      const hand: IAutoMovieVector3 = step.to.hands.right.point ?? BodyFrame.toWorld(step.to.position, step.to.heading, { forward: 0.45, left: -0.18, up: 1.2 });
      const aim: IAutoMovieVector3 = step.point ?? hand;
      const toward: number = BodyFrame.headingTo(hand, aim);
      const tip: IAutoMovieVector3 = BodyFrame.toWorld(hand, toward, { forward: 0.24, left: 0, up: 0 });
      const distance: number = Math.hypot(aim.x - tip.x, aim.y - tip.y, aim.z - tip.z);
      const arrival: number = e.contact + distance / DuelLaw.SPELL_SPEED;
      const defender: string | undefined = "subject" in action.at ? action.at.subject : undefined;
      // The answer that meets it: a deflection whose sweep lands in flight, or a shield standing at arrival.
      const answers = schedule.entries.filter((a) => a.subject === defender && (a.intent.capability === "deflect" || a.intent.capability === "shield"));
      const deflect = answers.find((a) => a.intent.capability === "deflect" && a.contact !== undefined && a.contact >= e.contact! + DuelLaw.REACTION_MIN && a.contact <= arrival + 0.15);
      const shield = answers.find((a) => a.intent.capability === "shield" && a.contact !== undefined && a.contact <= arrival && a.end >= arrival);
      const outcome: DuelLaw.Outcome = DuelLaw.outcome(action.spell === "disarm" ? "disarm" : "jinx", shield ? "shield" : deflect ? "deflect" : "none", distance);
      const id: string = e.intent.anchor ?? `cast-${e.index}`;
      if (outcome === "blocked") {
        const end: IAutoMovieVector3 = lerp(tip, aim, Math.max(0, 1 - 0.55 / Math.max(0.55, distance)));
        const at: number = e.contact + (distance - 0.55) / DuelLaw.SPELL_SPEED;
        streaks.push({ id, spell: action.spell, start: e.contact, from: tip, end: at, to: end });
        impacts.push({ at, point: end, spell: action.spell, outcome });
        continue;
      }
      if (outcome === "deflected" && deflect) {
        const turnAt: number = Math.max(e.contact + 0.05, Math.min(arrival, deflect.contact!));
        const turnPoint: IAutoMovieVector3 = lerp(tip, aim, Math.min(1, ((turnAt - e.contact) * DuelLaw.SPELL_SPEED) / Math.max(0.01, distance)));
        const da = StageAction.read(deflect.intent) as Extract<StageAction.Action, { kind: "deflect" }>;
        const dstep = deflect.state as IStageWorld.IStudentStep;
        const goal: IAutoMovieVector3 = da.toward === "floor" ? { ...BodyFrame.toWorld(dstep.to.position, dstep.to.heading + 0.6, { forward: 1.2, left: 0, up: 0 }), y: 0.01 } : (dstep.point ?? turnPoint);
        const second: number = Math.hypot(goal.x - turnPoint.x, goal.y - turnPoint.y, goal.z - turnPoint.z);
        const end: number = turnAt + second / DuelLaw.SPELL_SPEED;
        streaks.push({ id, spell: action.spell, start: e.contact, from: tip, end: turnAt, to: turnPoint });
        streaks.push({ id: `${id}/deflected`, spell: action.spell, start: turnAt, from: turnPoint, end, to: goal });
        impacts.push({ at: end, point: goal, spell: action.spell, outcome });
        continue;
      }
      streaks.push({ id, spell: action.spell, start: e.contact, from: tip, end: arrival, to: aim });
      impacts.push({ at: arrival, point: aim, spell: action.spell, outcome });
      void world;
    }
    return { streaks, impacts };
  }

  function lerp(a: IAutoMovieVector3, b: IAutoMovieVector3, k: number): IAutoMovieVector3 {
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
  }
}
