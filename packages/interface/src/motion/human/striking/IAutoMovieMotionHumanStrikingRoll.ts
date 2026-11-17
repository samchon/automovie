import type { IAutoMovieMotionHumanFreedomChoice } from "../posture/IAutoMovieMotionHumanFreedomChoice";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanStrikingHeld } from "./IAutoMovieMotionHumanStrikingHeld";

/**
 * Whether the arm can hold a held tool in a pose, and the turn of the tool
 * about its own line where the action leaves it free.
 *
 * The hand holds the tool as it took it, so a pose of the tool asks the
 * hand for one rotation, and the arm gives it only inside the ranges of the
 * shoulder, the forearm's twist and the wrist. What the arm gives is found
 * the only way that counts the ranges: the arm is fitted to the pose on the
 * body as it stands at the decisive instant, and the tool is read back from
 * the fitted hand. A pose the fitted hand misses is never played: it is
 * refused when the plan is built.
 *
 * A thrust states where the point goes and about which way the blade runs,
 * a levelled muzzle where the bore points, and neither states which way the
 * edge or the sights face; `hand` chooses that turn, and a lean of the line
 * inside a cone, by the same fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation back: The point of the tool the pose keeps, metres behind its working point.
 * @evidence contracts/development/design.md#principled-representation back: The point of the tool the pose keeps, metres behind its working point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingRoll.ts (StrikingRoll.chosen, props); lexicon/HumanFirearmReady.ts (HumanFirearmReady).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanStrikingHeld.IHandFrame, IAutoMovieMotionHumanFreedomChoice.Freedom, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingRoll {
  /**
   * A tool pose's freedoms as a law states them for `chosen`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation back: The point of the tool the pose keeps, metres behind its working point.
   * @evidence contracts/development/design.md#principled-representation back: The point of the tool the pose keeps, metres behind its working point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingRoll.ts (StrikingRoll.chosen, props); lexicon/HumanFirearmReady.ts (HumanFirearmReady).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanStrikingHeld.IHandFrame, IAutoMovieMotionHumanFreedomChoice.Freedom, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IChoice {
    /**
     * The hand frame the freedoms' values give.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanStrikingRoll.IChoice.frame: The hand frame the freedoms' values give.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrikingRoll.IChoice.frame is used through packages/motions/src/lexicon/HumanFirearmReady.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrikingRoll.IChoice.frame is used through packages/motions/src/lexicon/HumanFirearmReady.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrikingRoll.IChoice.frame is used through packages/motions/src/lexicon/HumanFirearmReady.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrikingRoll.IChoice.frame is used through packages/motions/src/lexicon/HumanFirearmReady.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrikingRoll.IChoice.frame is used through packages/motions/src/lexicon/HumanFirearmReady.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrikingRoll.IChoice.frame is used through packages/motions/src/lexicon/HumanFirearmReady.ts.
     */
    frame: (
      values: readonly number[],
    ) => IAutoMovieMotionHumanStrikingHeld.IHandFrame;

    /** The values to fit first, in the law's order of preference, nearest the asked pose first. */
    tried: readonly (readonly number[])[];

    /** Each value's freedom: its bounds or period and its refinement step. */
    freedoms: readonly IAutoMovieMotionHumanFreedomChoice.Freedom[];

    /** The point of the tool the pose keeps, metres behind its working point. */
    back: number;

    /** The body at the decisive instant, or its goals for each candidate frame when another hand supports that frame's tool. */
    posture:
      | IAutoMovieMotionHumanPosture
      | ((
          frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
        ) => IAutoMovieMotionHumanPosture);
  }
}
