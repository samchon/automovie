import type { IAutoMovieMotionHumanClimbLadder } from "../climbing/IAutoMovieMotionHumanClimbLadder";
import type { IAutoMovieMotionHumanWallClimb } from "../climbing/IAutoMovieMotionHumanWallClimb";
import type { IAutoMovieMotionHumanRope } from "../lexicon/IAutoMovieMotionHumanRope";
import type { IAutoMovieMotionHumanTreeClimb } from "../lexicon/IAutoMovieMotionHumanTreeClimb";
import type { IAutoMovieMotionHumanClimbStairs } from "../terrain/IAutoMovieMotionHumanClimbStairs";

/**
 * Climbing with the support law: the ladder, the stairs, the rope, the tree and a wall on fixed holds. One limb at a time takes the body's weight; a beat is 0.8 s on a ladder and 0.6 s on a rope or tree (provisional).
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
   * @param params The `ladder`, `rungs`, `landing` and `manner` of `IAutoMovieMotionHumanClimbLadder.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  climbLadder(
    params: IAutoMovieMotionHumanClimbLadder.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Climbing a flight of stairs up or down from standing before its first nosing, step over step (one foot per tread) or step by step (both feet on each tread), ending with both feet on the last tread.
   *
   * @param params The `pattern`, `lead`, `on`, `rail` and `manner` of `IAutoMovieMotionHumanClimbStairs.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  climbStairs(
    params: IAutoMovieMotionHumanClimbStairs.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Climb, descend, traverse or swing on a rope.
   *
   * @param params One of the variants of `IAutoMovieMotionHumanRope.IParams`: `IClimb`, `IDescend`, `ITraverseRope` or `ISwing`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  rope(params: IAutoMovieMotionHumanRope.IParams, anchor?: string): Chain;

  /**
   * Climb a tree, sit in it or descend.
   *
   * @param params One of the variants of `IAutoMovieMotionHumanTreeClimb.IParams`: `IClimb`, `ISit` or `IDescend`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  treeClimb(
    params: IAutoMovieMotionHumanTreeClimb.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Climbing a wall on fixed holds: the route's stances, each holding at least three of the four limbs on distinct holds, built by `wallClimbSupport` and moved through by `support`, so the support planner fits every contact and refuses a hold out of reach (Quaine and Martin 1999, DOI 10.1016/S0966-6362(99)00024-7).
   *
   * @param params The `start` holds and the `moves` of `IAutoMovieMotionHumanWallClimb`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wallClimb(params: IAutoMovieMotionHumanWallClimb, anchor?: string): Chain;
}
