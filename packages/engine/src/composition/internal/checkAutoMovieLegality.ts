import type {
  IAutoMovieCheckLegality,
  IAutoMovieSchedule,
} from "@automovie/interface";

/*
 * Check a schedule against a production's rules: each rule's predicate reads
 * one entry in the whole schedule and returns a violation text or null. The
 * engine applies every rule to every entry and reports, never repairs.
 * Parameter schedule: The resolved schedule.
 * Parameter rules: The production's rules.
 * Returns: Every violation, by entry then rule order.
 */
export function checkAutoMovieLegality(
  schedule: IAutoMovieSchedule,
  rules: readonly IAutoMovieCheckLegality.IRule[],
): IAutoMovieCheckLegality.IViolation[] {
  const violations: IAutoMovieCheckLegality.IViolation[] = [];
  for (const entry of schedule.entries)
    for (const rule of rules) {
      const detail: string | null = rule.check(entry, schedule);
      if (detail !== null)
        violations.push({ rule: rule.id, entry: entry.index, detail });
    }
  return violations;
}
