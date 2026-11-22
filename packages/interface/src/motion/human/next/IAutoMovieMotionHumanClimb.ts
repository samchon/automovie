import type { IAutoMovieMotionHumanClimbLadder } from "../climbing/IAutoMovieMotionHumanClimbLadder";
import type { IAutoMovieMotionHumanClimbStairs } from "../terrain/IAutoMovieMotionHumanClimbStairs";
import type { IAutoMovieMotionHumanRope } from "../lexicon/IAutoMovieMotionHumanRope";
import type { IAutoMovieMotionHumanTreeClimb } from "../lexicon/IAutoMovieMotionHumanTreeClimb";

/**
 * Mechanism: climbing with the support law: the ladder, the stairs, the rope and the tree. One limb at a time takes the body's weight; a beat is 0.8 s on a ladder and 0.6 s on a rope or tree (provisional).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Climb family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Climb laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanClimb<Chain> {
  /**
   * Climbing a vertical fixed ladder from the floor before it, in the four-beat ipsilateral pattern: right hand, right foot, left hand, left foot, one limb moving at a time, so three limbs always hold the ladder (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanClimb.climbLadder: Climbing a vertical fixed ladder from the floor before it, in the four-beat ipsilateral pattern: right hand, right foot, left hand, left foot, one limb moving at a time, so three limbs always hold the ladder (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanClimb.climbLadder is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanClimb.climbLadder is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanClimb.climbLadder is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanClimb.climbLadder is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanClimb.climbLadder is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanClimb.climbLadder is provided by the chain that implements IAutoMovieMotionHumanClimb.
   */
  climbLadder(params: IAutoMovieMotionHumanClimb.IClimbLadder, anchor?: string): Chain;

  /**
   * Climbing a flight of stairs up or down from standing before its first nosing, step over step (one foot per tread) or step by step (both feet on each tread), ending with both feet on the last tread.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanClimb.climbStairs: Climbing a flight of stairs up or down from standing before its first nosing, step over step (one foot per tread) or step by step (both feet on each tread), ending with both feet on the last tread.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanClimb.climbStairs is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanClimb.climbStairs is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanClimb.climbStairs is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanClimb.climbStairs is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanClimb.climbStairs is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanClimb.climbStairs is provided by the chain that implements IAutoMovieMotionHumanClimb.
   */
  climbStairs(params: IAutoMovieMotionHumanClimb.IClimbStairs, anchor?: string): Chain;

  /**
   * Climb, descend, traverse or swing on a rope.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanClimb.rope: Climb, descend, traverse or swing on a rope.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanClimb.rope is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanClimb.rope is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanClimb.rope is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanClimb.rope is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanClimb.rope is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanClimb.rope is provided by the chain that implements IAutoMovieMotionHumanClimb.
   */
  rope(params: IAutoMovieMotionHumanClimb.IRope, anchor?: string): Chain;

  /**
   * Climb a tree, sit in it or descend.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanClimb.treeClimb: Climb a tree, sit in it or descend.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanClimb.treeClimb is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanClimb.treeClimb is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanClimb.treeClimb is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanClimb.treeClimb is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanClimb.treeClimb is provided by the chain that implements IAutoMovieMotionHumanClimb.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanClimb.treeClimb is provided by the chain that implements IAutoMovieMotionHumanClimb.
   */
  treeClimb(params: IAutoMovieMotionHumanClimb.ITreeClimb, anchor?: string): Chain;
}

/**
 * The parameter types of the Climb methods.
 */
export namespace IAutoMovieMotionHumanClimb {
  /**
   * The parameters of `climbLadder`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `climbLadder`: the existing type of its law.
   */
  export type IClimbLadder = IAutoMovieMotionHumanClimbLadder.IParams;

  /**
   * The parameters of `climbStairs`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `climbStairs`: the existing type of its law.
   */
  export type IClimbStairs = IAutoMovieMotionHumanClimbStairs.IParams;

  /**
   * The parameters of `rope`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `rope`: the existing type of its law.
   */
  export type IRope = IAutoMovieMotionHumanRope.IParams;

  /**
   * The parameters of `treeClimb`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `treeClimb`: the existing type of its law.
   */
  export type ITreeClimb = IAutoMovieMotionHumanTreeClimb.IParams;
}
