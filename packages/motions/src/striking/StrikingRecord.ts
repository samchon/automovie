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
 */
export namespace StrikingRecord {
  /** One strike's decisions. */
  export interface IRecord {
    /** The intended landing offset from the aim point, world metres. */
    offset: IAutoMovieVector3;

    /** The contact goal predicted at the launch, offset included, world metres. */
    planned: IAutoMovieVector3;

    /** The reach solve's status at the planned contact. */
    status: StrikingReach.ISolution["status"];

    /**
     * The film second the weapon met a surface by a second, if it has.
     *
     * @param seconds Film seconds.
     * @returns The contact second, or undefined.
     */
    stop(seconds: number): number | undefined;
  }

  const RECORDS: WeakMap<IHumanActionPlan, () => IRecord> = new WeakMap();

  /**
   * Register a plan's record.
   *
   * @param plan The strike's plan.
   * @param record Its record, built on demand.
   */
  export function register(plan: IHumanActionPlan, record: () => IRecord): void {
    RECORDS.set(plan, record);
  }

  /**
   * A planned strike's record.
   *
   * @param plan A plan.
   * @returns Its record, or undefined for a plan that is not a strike.
   */
  export function of(plan: IHumanActionPlan): IRecord | undefined {
    return RECORDS.get(plan)?.();
  }
}
