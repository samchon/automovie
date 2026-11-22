import type { IAutoMovieMotionHumanCover as ILegacyCover } from "../lexicon/IAutoMovieMotionHumanCover";

/**
 * Mechanism: moving against a cover: peeking, sidling, a window and a breach, with the back or the chest against the wall.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Climb family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Climb laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanCover<Chain> {
  /**
   * Take cover: peek round it, sidle along it, look out of a window or breach.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanCover.cover: Take cover: peek round it, sidle along it, look out of a window or breach.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCover.cover is provided by the chain that implements IAutoMovieMotionHumanCover.
   */
  cover(params: IAutoMovieMotionHumanCover.ICover, anchor?: string): Chain;
}

/**
 * The parameter types of the Cover methods.
 */
export namespace IAutoMovieMotionHumanCover {
  /**
   * The parameters of `cover`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `cover`: the existing type of its law.
   */
  export type ICover = ILegacyCover.IParams;
}
