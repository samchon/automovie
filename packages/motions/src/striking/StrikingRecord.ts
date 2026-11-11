import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { StrikingReach } from "./StrikingReach";

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
  /**
   * One strike's decisions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and meaning.
   * @evidence contracts/development/design.md#principled-representation World points for the offset, the plan and the reach, the shared reach status, and the stop as a function of the film second so a stop is reported only once it has happened.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What audits and capture verdicts compare a strike with.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the reach status union.
   */
  export interface IRecord {
    /** The intended landing offset from the aim point, world metres. */
    offset: IAutoMovieVector3;

    /** The contact goal predicted at the launch, offset included, world metres. */
    planned: IAutoMovieVector3;

    /** Where the weapon's surface reaches at the planned contact, world metres: the planned point, or the limb's highest or farthest reachable point when the target lies beyond it. */
    reached: IAutoMovieVector3;

    /** The reach solve's status at the planned contact. */
    status: StrikingReach.ISolution["status"];

    /**
     * The film second the weapon met a surface by a second, if it has.
     *
     * @param seconds Film seconds.
     * @returns The contact second, or undefined.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the timebase and the meaning of undefined.
     * @evidence contracts/development/implementation.md#principled-implementation Each strike supplies its stroke's stop: the second the performance's joint resolution committed, reported once it is at or before the asked second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A comparison with the committed second.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant time once resolved.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the committed second.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the strike's plan.
     */
    stop(seconds: number): number | undefined;
  }

  const RECORDS: WeakMap<IHumanActionPlan, () => IRecord> = new WeakMap();

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
    plan: IHumanActionPlan,
    record: () => IRecord,
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
  export function of(plan: IHumanActionPlan): IRecord | undefined {
    return carries(plan) ? plan.record() : RECORDS.get(plan)?.();
  }

  /**
   * A strike's plan: the plan itself carries its record, built on demand
   * from its current geometry and committed stop.
   */
  export interface IPlan extends IHumanActionPlan {
    /**
     * What the strike decided, read from its current geometry.
     *
     * @returns The record.
     */
    record(): IRecord;
  }

  /**
   * Whether a plan carries a strike's record.
   *
   * @param plan A plan.
   * @returns True for a strike's plan.
   */
  export function carries(plan: IHumanActionPlan): plan is IPlan {
    return "record" in plan && typeof plan.record === "function";
  }
}
