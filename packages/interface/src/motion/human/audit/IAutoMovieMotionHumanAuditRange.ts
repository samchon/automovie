import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether every joint of a displayed motion stays inside its anatomical
 * range of motion at every instant.
 *
 * A body cannot bend an elbow backward or turn a knee sideways, however
 * smooth and collision-free the result looks. The reading takes the
 * displayed pose's clinical joint angles at each grid instant and measures
 * each joint against the humanoid range table the pose gate enforces
 * (`DEFAULT_HUMANOID_ROM`), by the gate's own scan (`scanJointRom`): an
 * angle outside its interval overshoots by its distance to the nearer bound,
 * an angle on an axis the joint does not have by its whole magnitude, and a
 * ball joint's combined flexion and abduction by what it exceeds the swing
 * cone. A joint the table does not list is unconstrained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: The motion's length, film seconds. overshoot: The farthest a joint stands past its range, degrees, with the bone and the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a non-finite angle.
 * @evidence contracts/development/design.md#principled-representation duration: The motion's length, film seconds. overshoot: The farthest a joint stands past its range, degrees, with the bone and the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a non-finite angle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.measure, motion); audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.unloaded, posed); audit/HumanVerdicts.ts (HumanVerdicts.of.posed, return); audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.measure, return); audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.unloaded, return); audit/HumanVerdicts.ts (HumanVerdicts.of).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMoviePose, IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAuditRange {
  /**
   * A motion as this audit reads it: a person's displayed pose at any film
   * second. `HumanPerformance` is one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and which producer satisfies it.
   * @evidence contracts/development/design.md#principled-representation Clinical angles live on the pose, not on the resolved bones the other audits read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, a structural subset of `HumanPerformance`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's pose; no cast or optional member.
   */
  export interface IPosed {
    /** The motion's length, film seconds. */
    readonly duration: number;

    /**
     * A person's displayed pose.
     *
     * @param subject The person.
     * @param seconds Film seconds, within the motion.
     * @returns The pose, joints in clinical degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanAuditRange.IPosed.pose: A person's displayed pose.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanAuditRange.IPosed.pose is used through packages/motions/src/audit/AutoMovieMotionHumanAuditRange.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanAuditRange.IPosed.pose is used through packages/motions/src/audit/AutoMovieMotionHumanAuditRange.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanAuditRange.IPosed.pose is used through packages/motions/src/audit/AutoMovieMotionHumanAuditRange.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanAuditRange.IPosed.pose is used through packages/motions/src/audit/AutoMovieMotionHumanAuditRange.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanAuditRange.IPosed.pose is used through packages/motions/src/audit/AutoMovieMotionHumanAuditRange.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanAuditRange.IPosed.pose is used through packages/motions/src/audit/AutoMovieMotionHumanAuditRange.ts.
     */
    pose(subject: string, seconds: number): IAutoMoviePose;
  }

  /**
   * What the reading found.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and what it is read on.
   * @evidence contracts/development/design.md#principled-representation The worst overshoot and the one share it cannot tell.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The farthest a joint stands past its range, degrees, with the bone and the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a non-finite angle. */
    overshoot: IAutoMovieMotionHumanAuditMeasure;

    /** The part of the grid's instants at which some joint is past its range, in [0, 1]. */
    share: number;
  }
}
