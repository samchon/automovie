import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";

/**
 * A target's world point and outward normal at a film second: a person's
 * region, the performer's own, a prop's point, a point of the world or of
 * the performer's frame, or the virtual opponent of no target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation root: Their root, world metres. yaw: Their heading, degrees about +Y. heights: The heights of a `none` target's lines, world metres.
 * @evidence contracts/development/design.md#principled-representation root: Their root, world metres. yaw: Their heading, degrees about +Y. heights: The heights of a `none` target's lines, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformance.ts (HumanPerformance.aim, frame); perform/HumanPerformanceAim.ts (HumanPerformanceAim.aim, frame); perform/HumanPerformanceAim.ts (HumanPerformanceAim.frame, bones); perform/HumanPerformanceAim.ts (HumanPerformanceAim.frame, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPerformanceAim {
  /**
   * The aiming person's own frame, body and bones (`aim`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation root: Their root, world metres. yaw: Their heading, degrees about +Y. heights: The heights of a `none` target's lines, world metres.
   * @evidence contracts/development/design.md#principled-representation root: Their root, world metres. yaw: Their heading, degrees about +Y. heights: The heights of a `none` target's lines, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformance.ts (HumanPerformance.aim, frame); perform/HumanPerformanceAim.ts (HumanPerformanceAim.aim, frame); perform/HumanPerformanceAim.ts (HumanPerformanceAim.frame, bones); perform/HumanPerformanceAim.ts (HumanPerformanceAim.frame, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** Their root, world metres. */
    root: IAutoMovieVector3;

    /** Their heading, degrees about +Y. */
    yaw: number;

    /** The heights of a `none` target's lines, world metres. */
    heights: Record<"low" | "middle" | "high", number>;

    /** A `none` target's distance when it names none, metres: the performer's own arm length, upper arm plus forearm plus hand. */
    range: number;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * Their bones.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPerformanceAim.IFrame.bones: Their bones.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPerformanceAim.IFrame.bones is used through packages/motions/src/perform/HumanPerformanceAim.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPerformanceAim.IFrame.bones is used through packages/motions/src/perform/HumanPerformanceAim.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPerformanceAim.IFrame.bones is used through packages/motions/src/perform/HumanPerformanceAim.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPerformanceAim.IFrame.bones is used through packages/motions/src/perform/HumanPerformanceAim.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPerformanceAim.IFrame.bones is used through packages/motions/src/perform/HumanPerformanceAim.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPerformanceAim.IFrame.bones is used through packages/motions/src/perform/HumanPerformanceAim.ts.
     */
    bones: (
      requested?: ReadonlySet<AutoMovieHumanoidBone>) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** Their subject id. */
    subject?: string;
  }
}
