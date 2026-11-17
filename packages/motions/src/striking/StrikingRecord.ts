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
 * Records are keyed by the plan object and built on demand from the plan's
 * geometry, so reading one evaluates the strike's postures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is recorded, why audits read it and that reading one evaluates postures.
 * @evidence contracts/development/design.md#principled-representation A record per plan in world metres and film seconds, kept in a weak registry so plans stay the identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record type and the register and read functions the strike laws, the captures and the tests use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan type and the reach status union.
 */
export namespace StrikingRecord {
  const RECORDS: WeakMap<
    IAutoMovieMotionHumanActionPlan,
    () => IAutoMovieMotionHumanStrikingRecord.IRecord
  > = new WeakMap();

  /**
   * Register a plan's record.
   *
   * @param plan The strike's plan.
   * @param record Its record, built on demand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the key and that the record is built on demand.
   * @evidence contracts/development/implementation.md#principled-implementation Stores the builder in a weak map keyed by the plan.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One store.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Stores a builder; nothing is computed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weak key releases each builder with its plan.
   */
  export function register(
    plan: IAutoMovieMotionHumanActionPlan,
    record: () => IAutoMovieMotionHumanStrikingRecord.IRecord,
  ): void {
    RECORDS.set(plan, record);
  }

  /**
   * A planned strike's record.
   *
   * @param plan A plan.
   * @returns Its record, or undefined for a plan that is not a strike.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the meaning of undefined.
   * @evidence contracts/development/implementation.md#principled-implementation Looks up the plan's builder and runs it, so the record reflects the plan's current geometry and stop.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The builder's cost, which reads the plan's cached geometry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Not cached here: the plan's geometry is cached by the plan and may be settled, so each read rebuilds the record from it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanStrikingRecord.IRecord | undefined {
    return carries(plan) ? plan.record() : RECORDS.get(plan)?.();
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
