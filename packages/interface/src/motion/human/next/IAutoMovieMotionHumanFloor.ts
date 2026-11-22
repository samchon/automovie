import type { IAutoMovieMotionHumanCrabWalk } from "../floor/IAutoMovieMotionHumanCrabWalk";
import type { IAutoMovieMotionHumanCrawl } from "../floor/IAutoMovieMotionHumanCrawl";
import type { IAutoMovieMotionHumanDive } from "../floor/IAutoMovieMotionHumanDive";
import type { IAutoMovieMotionHumanGetUp } from "../floor/IAutoMovieMotionHumanGetUp";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanRoll } from "../floor/IAutoMovieMotionHumanRoll";

/**
 * Mechanism: The actions on and from the floor: lying down, rolling, crawling and getting up.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Floor family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Floor laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanFloor<Chain> {
  /**
   * Lying down on the floor from standing into a position: supine, prone, or on the left or right side.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFloor.lieDown: Lying down on the floor from standing into a position: supine, prone, or on the left or right side.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFloor.lieDown is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFloor.lieDown is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFloor.lieDown is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFloor.lieDown is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFloor.lieDown is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFloor.lieDown is provided by the chain that implements IAutoMovieMotionHumanFloor.
   */
  lieDown(params: IAutoMovieMotionHumanFloor.ILieDown, anchor?: string): Chain;

  /**
   * Getting up from the floor to standing: from lying on the back or the front, from the hands and knees or crouched, as a crawl ends.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFloor.getUp: Getting up from the floor to standing: from lying on the back or the front, from the hands and knees or crouched, as a crawl ends.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFloor.getUp is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFloor.getUp is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFloor.getUp is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFloor.getUp is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFloor.getUp is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFloor.getUp is provided by the chain that implements IAutoMovieMotionHumanFloor.
   */
  getUp(params: IAutoMovieMotionHumanFloor.IGetUp, anchor?: string): Chain;

  /**
   * A forward or backward roll on the floor: the body crouches into a tuck over its feet, rolls once round over its back as a ball rolls, without flight, and rises from the tuck on its feet where the roll has carried it.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFloor.roll: A forward or backward roll on the floor: the body crouches into a tuck over its feet, rolls once round over its back as a ball rolls, without flight, and rises from the tuck on its feet where the roll has carried it.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFloor.roll is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFloor.roll is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFloor.roll is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFloor.roll is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFloor.roll is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFloor.roll is provided by the chain that implements IAutoMovieMotionHumanFloor.
   */
  roll(params: IAutoMovieMotionHumanFloor.IRoll, anchor?: string): Chain;

  /**
   * Crawling on hands and knees along the heading, from standing: the body gets down onto hands and knees, then crawls a number of cycles in the diagonal pattern, each hand moving with the opposite knee like a quadruped's trot (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFloor.crawl: Crawling on hands and knees along the heading, from standing: the body gets down onto hands and knees, then crawls a number of cycles in the diagonal pattern, each hand moving with the opposite knee like a quadruped's trot (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFloor.crawl is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFloor.crawl is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFloor.crawl is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFloor.crawl is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFloor.crawl is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFloor.crawl is provided by the chain that implements IAutoMovieMotionHumanFloor.
   */
  crawl(params: IAutoMovieMotionHumanFloor.ICrawl, anchor?: string): Chain;

  /**
   * A supine quadrupedal crawl, the crab walk of horror films: from sitting, the hands plant behind the hips and the pelvis lifts, and the body travels on its hands and feet with the chest up, feet first or head first.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFloor.crabWalk: A supine quadrupedal crawl, the crab walk of horror films: from sitting, the hands plant behind the hips and the pelvis lifts, and the body travels on its hands and feet with the chest up, feet first or head first.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFloor.crabWalk is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFloor.crabWalk is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFloor.crabWalk is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFloor.crabWalk is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFloor.crabWalk is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFloor.crabWalk is provided by the chain that implements IAutoMovieMotionHumanFloor.
   */
  crabWalk(params: IAutoMovieMotionHumanFloor.ICrabWalk, anchor?: string): Chain;

  /**
   * A fall onto the floor on purpose from a stance: a goalkeeper's dive to the side, or a sliding tackle forward on the hip.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanFloor.dive: A fall onto the floor on purpose from a stance: a goalkeeper's dive to the side, or a sliding tackle forward on the hip.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanFloor.dive is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanFloor.dive is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanFloor.dive is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanFloor.dive is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanFloor.dive is provided by the chain that implements IAutoMovieMotionHumanFloor.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanFloor.dive is provided by the chain that implements IAutoMovieMotionHumanFloor.
   */
  dive(params: IAutoMovieMotionHumanFloor.IDive, anchor?: string): Chain;
}

/**
 * The parameter types of the Floor methods.
 */
export namespace IAutoMovieMotionHumanFloor {
  /**
   * The parameters of `lieDown`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `lieDown`: the existing type of its law.
   */
  export type ILieDown = IAutoMovieMotionHumanLieDown.IParams;

  /**
   * The parameters of `getUp`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `getUp`: the existing type of its law.
   */
  export type IGetUp = IAutoMovieMotionHumanGetUp.IParams;

  /**
   * The parameters of `roll`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `roll`: the existing type of its law.
   */
  export type IRoll = IAutoMovieMotionHumanRoll.IParams;

  /**
   * The parameters of `crawl`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `crawl`: the existing type of its law.
   */
  export type ICrawl = IAutoMovieMotionHumanCrawl.IParams;

  /**
   * The parameters of `crabWalk`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `crabWalk`: the existing type of its law.
   */
  export type ICrabWalk = IAutoMovieMotionHumanCrabWalk.IParams;

  /**
   * The parameters of `dive`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `dive`: the existing type of its law.
   */
  export type IDive = IAutoMovieMotionHumanDive.IParams;
}
