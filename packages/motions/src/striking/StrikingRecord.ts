import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingRecord,
} from "@automovie/interface";

/**
 * A planned strike's record.
 *
 * @param plan A plan.
 * @returns Its record, or undefined for a plan that is not a strike.
 */
export function StrikingRecord(
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanStrikingRecord.IRecord | undefined {
  return StrikingRecord.carries(plan) ? plan.record() : undefined;
}

/**
 * What a planned strike decided, for audits and captures: the landing offset it
 * intended (declared accuracy plus seeded scatter), the goal it planned at its
 * launch, how its reach solve came out, and the second its weapon met a
 * surface. Audits compare a strike against this plan, so a clumsy strike still
 * passes when it lands where it meant to.
 *
 * Each strike's plan carries its record as a member (`IPlan.record`), built on
 * demand from the plan's geometry, so reading one evaluates the strike's
 * postures, and a plan copied or wrapped by a spread keeps it.
 */
export namespace StrikingRecord {
  /**
   * Whether a plan carries a strike's record.
   *
   * @param plan A plan.
   * @returns True for a strike's plan.
   */
  export function carries(
    plan: IAutoMovieMotionHumanActionPlan,
  ): plan is IAutoMovieMotionHumanStrikingRecord.IPlan {
    return "record" in plan && typeof plan.record === "function";
  }
}
