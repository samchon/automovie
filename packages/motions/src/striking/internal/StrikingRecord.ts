import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingRecord,
} from "@automovie/interface";

/*
 * A planned strike's record.
 * Parameter plan: A plan.
 * Returns: Its record, or undefined for a plan that is not a strike.
 */
export function StrikingRecord(
  plan: IAutoMovieMotionHumanActionPlan,
): IAutoMovieMotionHumanStrikingRecord.IRecord | undefined {
  return plan.record?.();
}

/*
 * What a planned strike decided, for audits and captures: the landing offset it
 * intended (declared accuracy plus seeded scatter), the goal it planned at its
 * launch, how its reach solve came out, and the second its weapon met a
 * surface. Audits compare a strike against this plan, so a clumsy strike still
 * passes when it lands where it meant to.
 *
 * Each strike's plan carries its record as a member
 * (`IAutoMovieMotionHumanActionPlan.record`), built on demand from the plan's
 * geometry, so reading one evaluates the strike's postures, and a plan copied
 * or wrapped by a spread keeps it.
 */
export namespace StrikingRecord {
  /*
   * Whether a plan carries a strike's record.
   * Parameter plan: A plan.
   * Returns: True for a strike's plan.
   */
  export function carries(
    plan: IAutoMovieMotionHumanActionPlan,
  ): plan is IAutoMovieMotionHumanStrikingRecord.IPlan {
    return plan.record !== undefined;
  }
}
