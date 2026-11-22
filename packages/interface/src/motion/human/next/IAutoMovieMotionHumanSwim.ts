import type { IAutoMovieMotionHumanAquatic } from "../sport/IAutoMovieMotionHumanAquatic";
import type { IAutoMovieMotionHumanSwim as ILegacySwim } from "../sport/IAutoMovieMotionHumanSwim";

/**
 * Mechanism: Moving and floating in water: the strokes and the aquatic actions. The crawl cycle is 1.4 s at a 1 m/s glide (provisional).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Swim family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Swim laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSwim<Chain> {
  /**
   * Swimming on a declared water plane (#3254, M25): treading water and the front crawl.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSwim.swim: Swimming on a declared water plane (#3254, M25): treading water and the front crawl.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSwim.swim is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSwim.swim is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSwim.swim is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSwim.swim is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSwim.swim is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSwim.swim is provided by the chain that implements IAutoMovieMotionHumanSwim.
   */
  swim(params: IAutoMovieMotionHumanSwim.ISwim, anchor?: string): Chain;

  /**
   * Timed pool, aquatic team and small-craft performances.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSwim.aquatic: Timed pool, aquatic team and small-craft performances.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSwim.aquatic is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSwim.aquatic is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSwim.aquatic is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSwim.aquatic is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSwim.aquatic is provided by the chain that implements IAutoMovieMotionHumanSwim.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSwim.aquatic is provided by the chain that implements IAutoMovieMotionHumanSwim.
   */
  aquatic(params: IAutoMovieMotionHumanSwim.IAquatic, anchor?: string): Chain;
}

/**
 * The parameter types of the Swim methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of each Swim method.
 * @evidence contracts/development/design.md#principled-representation Each parameter type is the law's existing type, named once here.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One parameter type per method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is redefined: every name aliases the type its law already reads.
 */
export namespace IAutoMovieMotionHumanSwim {
  /** The parameters of `swim`. */
  export type ISwim = ILegacySwim.IParams;

  /** The parameters of `aquatic`. */
  export type IAquatic = IAutoMovieMotionHumanAquatic.IParams;
}
