import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanStrikingReach } from "./IAutoMovieMotionHumanStrikingReach";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
 * @evidence contracts/development/common.md#meaningful-documentation offset: The intended landing offset from the aim point, world metres. planned: The contact goal predicted at the launch, offset included, world metres. reached: Where the weapon's surface reaches at the planned contact, world metres: the planned point, or the limb's highest or farthest reachable point when the target lies beyond it.
 * @evidence contracts/development/design.md#principled-representation offset: The intended landing offset from the aim point, world metres. planned: The contact goal predicted at the launch, offset included, world metres. reached: Where the weapon's surface reaches at the planned contact, world metres: the planned point, or the limb's highest or farthest reachable point when the target lies beyond it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/kick.ts (kick.plan, return); striking/knee.ts (knee.plan, return); striking/punch.ts (punch.plan, return); striking/StrikingRecord.ts (StrikingRecord.register, record); striking/StrikingRecord.ts (StrikingRecord.of, return); striking/StrikingRecord.ts (StrikingRecord.carries, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanStrikingReach.ISolution identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingRecord {
  /**
   * One strike's decisions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and meaning.
   * @evidence contracts/development/design.md#principled-representation World points for the offset, the plan and the reach, the shared reach status, and the stop as a function of the film second so a stop is reported only once it has happened.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What audits and capture verdicts compare a strike with.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the reach status union.
   */
  export interface IRecord {
    /** The end joint of the limb that carries the weapon: the punching hand, or the foot of the kicking or kneeing leg. */
    limb: "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

    /** The intended landing offset from the aim point, world metres. */
    offset: IAutoMovieVector3;

    /** The contact goal predicted at the launch, offset included, world metres. */
    planned: IAutoMovieVector3;

    /** Where the weapon's surface reaches at the planned contact, world metres: the planned point, or the limb's highest or farthest reachable point when the target lies beyond it. */
    reached: IAutoMovieVector3;

    /** The reach solve's status at the planned contact. */
    status: IAutoMovieMotionHumanStrikingReach.ISolution["status"];

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

  /**
   * A strike's plan: the plan itself carries its record, built on demand
   * from its current geometry and committed stop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation record: What the strike decided, read from its current geometry.
   * @evidence contracts/development/design.md#principled-representation record: What the strike decided, read from its current geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingRecord.ts (StrikingRecord.carries, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanStrikingRecord.IRecord identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /**
     * What the strike decided, read from its current geometry.
     *
     * @returns The record.
     */
    record(): IAutoMovieMotionHumanStrikingRecord.IRecord;
  }
}
