import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * Contracts used by HumanPerformanceHold.prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
 * @evidence contracts/development/design.md#principled-representation bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop, own).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPerformanceHold {
  /**
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`). Input own of HumanPerformanceHold.prop. The performer reading the prop and their own bones, for a prop they may carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
   * @evidence contracts/development/design.md#principled-representation bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop, own).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPropOwn = {
    /** Scene subject id of the performer querying the prop, which may be carried by that performer. */
    subject: string;
    /**
     * Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones: Synchronous accessor for that performer's currently resolved bones, at least those `requested` (every bone when absent); the returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones is used through packages/motions/src/perform/HumanPerformanceHold.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones is used through packages/motions/src/perform/HumanPerformanceHold.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones is used through packages/motions/src/perform/HumanPerformanceHold.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones is used through packages/motions/src/perform/HumanPerformanceHold.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones is used through packages/motions/src/perform/HumanPerformanceHold.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformanceHold.IPropOwn.bones is used through packages/motions/src/perform/HumanPerformanceHold.ts.
     */
    bones: (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  };
}
