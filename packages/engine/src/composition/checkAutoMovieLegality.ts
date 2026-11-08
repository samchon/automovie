import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/**
 * Check a schedule against a production's rules: each rule's predicate reads
 * one entry in the whole schedule and returns a violation text or null. The
 * engine applies every rule to every entry and reports, never repairs.
 *
 * @param schedule The resolved schedule.
 * @param rules The production's rules.
 * @returns Every violation, by entry then rule order.
 */
export function checkAutoMovieLegality(
  schedule: IAutoMovieSchedule,
  rules: readonly checkAutoMovieLegality.IRule[],
): checkAutoMovieLegality.IViolation[] {
  const violations: checkAutoMovieLegality.IViolation[] = [];
  for (const entry of schedule.entries)
    for (const rule of rules) {
      const detail: string | null = rule.check(entry, schedule);
      if (detail !== null)
        violations.push({ rule: rule.id, entry: entry.index, detail });
    }
  return violations;
}
/** Companion types of {@link checkAutoMovieLegality}. */
export namespace checkAutoMovieLegality {
  /** A production rule. */
  export interface IRule {
    /** Stable rule id. */
    id: string;

    /** A violation text for this entry, or null when it holds. */
    check(
      entry: IAutoMovieSchedule.IEntry,
      schedule: IAutoMovieSchedule,
    ): string | null;
  }

  /** One violation. */
  export interface IViolation {
    /** The rule id. */
    rule: string;

    /** The entry's walk-order index. */
    entry: number;

    /** The rule's text. */
    detail: string;
  }
}
