import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * Contracts used by HumanPerformanceHold.prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation bones: Synchronous accessor for that performer's currently resolved bones; returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
 * @evidence contracts/development/design.md#principled-representation bones: Synchronous accessor for that performer's currently resolved bones; returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop, own).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPerformanceHold {
  /**
   * A prop's world frame at a film second (`HumanPerformanceRead.prop`). Input own of HumanPerformanceHold.prop. The performer reading the prop and their own bones, for a prop they may carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation bones: Synchronous accessor for that performer's currently resolved bones; returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
   * @evidence contracts/development/design.md#principled-representation bones: Synchronous accessor for that performer's currently resolved bones; returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop, own).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPropOwn = {
    /** Scene subject id of the performer querying the prop, which may be carried by that performer. */
    subject: string;
    /** Synchronous accessor for that performer's currently resolved bones; returned map is borrowed and must remain stable for the current query. Failures propagate to hold resolution. */
    bones: () => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  };
}
