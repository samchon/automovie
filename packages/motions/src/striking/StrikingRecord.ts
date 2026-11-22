import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanStrikingRecord,
} from "@automovie/interface";

/**
 * What a planned strike decided, for audits and captures: the landing
 * offset it intended (declared accuracy plus seeded scatter), the goal it
 * planned at its launch, how its reach solve came out, and the second its
 * weapon met a surface. Audits compare a strike against this plan, so a
 * clumsy strike still passes when it lands where it meant to.
 *
 * Each strike's plan carries its record as a member (`IPlan.record`), built
 * on demand from the plan's geometry, so reading one evaluates the strike's
 * postures, and a plan copied or wrapped by a spread keeps it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is recorded, why audits read it, where the record lives and that reading one evaluates postures.
 * @evidence contracts/development/design.md#principled-representation The record is the plan's own member in world metres and film seconds, so the plan stays its identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reader and the predicate the strike laws, the captures and the tests use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan type and the reach status union; no registry beside the plan.
 */
export namespace StrikingRecord {
  /**
   * A planned strike's record.
   *
   * @param plan A plan.
   * @returns Its record, or undefined for a plan that is not a strike.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the meaning of undefined.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the plan's own record builder, so the record reflects the plan's current geometry and stop.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The builder's cost, which reads the plan's cached geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Not cached here: the plan's geometry is cached by the plan and may be settled, so each read rebuilds the record from it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanStrikingRecord.IRecord | undefined {
    return carries(plan) ? plan.record() : undefined;
  }

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
