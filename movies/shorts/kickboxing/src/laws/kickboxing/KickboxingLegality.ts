import type { IAutoMovieSchedule, checkAutoMovieLegality } from "@automovie/engine";

import { KickboxingAction } from "./KickboxingAction";
import { KickboxingDefense } from "./KickboxingDefense";
import { KickboxingTechnique } from "./KickboxingTechnique";

/**
 * The rules a resolved bout schedule must keep, in the engine's
 * `checkAutoMovieLegality` form: every answer pairs with its attack, no attack
 * follows a knockdown, the clinch holds for one knee, kicks prepare or finish
 * combinations, and no limb does two things at once.
 *
 * ```ts
 * checkAutoMovieLegality(schedule, KickboxingLegality.rules); // []
 * ```
 *
 * @evidence docs/research/kickboxing/rules.md#legal-actions The clinch allows one immediate knee; no attack on a downed opponent.
 * @evidence docs/research/kickboxing/exchanges.md#targets Every kick prepares or finishes a combination, except checks, teeps and the clinch knee.
 * @evidence docs/research/kickboxing/techniques.md#defenses Each defense meets only its lines.
 */
export namespace KickboxingLegality {
  /** Seconds two entries may be apart and still touch, the float tolerance of summed durations. */
  const TOUCH: number = 1e-6;

  const strike = (entry: IAutoMovieSchedule.IEntry): Extract<KickboxingAction.IAction, { kind: "strike" }> | null => {
    if (entry.intent.capability !== "strike") return null;
    const action: KickboxingAction.IAction = KickboxingAction.read(entry.intent);
    return action.kind === "strike" ? action : null;
  };

  /** The limbs an entry occupies. */
  const limbs = (entry: IAutoMovieSchedule.IEntry): string[] => {
    if (entry.intent.capability !== "strike" && entry.intent.capability !== "answer") return [];
    const action: KickboxingAction.IAction = KickboxingAction.read(entry.intent);
    if (action.kind === "strike") {
      const spec: KickboxingTechnique.ISpec = KickboxingTechnique.table[action.technique];
      return [`${spec.limb}-${spec.side}`];
    }
    if (action.kind === "answer") {
      const limb: KickboxingDefense.Limb = KickboxingDefense.limb(action.answer);
      const side: KickboxingTechnique.Side = KickboxingTechnique.opposite(KickboxingTechnique.table[action.against].side);
      return limb === "rear-hand" ? ["arm-right"] : limb === "attacked-arm" ? [`arm-${side}`] : limb === "lead-leg" ? ["leg-left"] : [];
    }
    return [];
  };

  /** The rules. */
  export const rules: readonly checkAutoMovieLegality.IRule[] = Object.freeze([
    {
      id: "paired-answer",
      check: (entry: IAutoMovieSchedule.IEntry): string | null =>
        entry.outcome === "illegal" ? `answer ${entry.index} does not meet its attack` : null,
    },
    {
      id: "no-attack-after-knockdown",
      check: (entry: IAutoMovieSchedule.IEntry, schedule: IAutoMovieSchedule): string | null => {
        if (strike(entry) === null) return null;
        const fall: IAutoMovieSchedule.IEntry | undefined = schedule.entries.find((other) => {
          if (other.intent.capability !== "phase") return false;
          const action: KickboxingAction.IAction = KickboxingAction.read(other.intent);
          return action.kind === "phase" && action.phase === "fall" && other.subject !== entry.subject;
        });
        return fall !== undefined && entry.start >= fall.start ? `strike ${entry.index} follows the knockdown` : null;
      },
    },
    {
      id: "single-clinch-knee",
      check: (entry: IAutoMovieSchedule.IEntry, schedule: IAutoMovieSchedule): string | null => {
        const action = strike(entry);
        if (action === null || KickboxingTechnique.table[action.technique].family !== "knee") return null;
        const touching = schedule.entries.filter(
          (other) =>
            other !== entry &&
            other.subject === entry.subject &&
            strike(other) !== null &&
            (Math.abs(other.end - entry.start) < TOUCH || Math.abs(entry.end - other.start) < TOUCH),
        );
        return touching.length > 0 ? `clinch knee ${entry.index} is not a single knee` : null;
      },
    },
    {
      id: "kick-in-combination",
      check: (entry: IAutoMovieSchedule.IEntry, schedule: IAutoMovieSchedule): string | null => {
        const action = strike(entry);
        if (action === null) return null;
        const spec: KickboxingTechnique.ISpec = KickboxingTechnique.table[action.technique];
        if (spec.family !== "round-kick") return null;
        const joined: boolean = schedule.entries.some(
          (other) =>
            other !== entry &&
            other.subject === entry.subject &&
            strike(other) !== null &&
            (Math.abs(other.end - entry.start) < TOUCH || Math.abs(entry.end - other.start) < TOUCH),
        );
        return joined ? null : `kick ${entry.index} stands alone`;
      },
    },
    {
      id: "limb-exclusive",
      check: (entry: IAutoMovieSchedule.IEntry, schedule: IAutoMovieSchedule): string | null => {
        const own: string[] = limbs(entry);
        if (own.length === 0) return null;
        const clash = schedule.entries.find(
          (other) =>
            other.index > entry.index &&
            other.subject === entry.subject &&
            other.start < entry.end - TOUCH &&
            entry.start < other.end - TOUCH &&
            limbs(other).some((limb: string): boolean => own.includes(limb)),
        );
        return clash ? `entries ${entry.index} and ${clash.index} use one limb at once` : null;
      },
    },
  ]);
}
