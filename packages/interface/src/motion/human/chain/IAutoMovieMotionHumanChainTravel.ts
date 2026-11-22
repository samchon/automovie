import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanStand } from "../actions/IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanClimbLadder } from "../climbing/IAutoMovieMotionHumanClimbLadder";
import type { IAutoMovieMotionHumanApproach } from "../everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanStepOver } from "../everyday/IAutoMovieMotionHumanStepOver";
import type { IAutoMovieMotionHumanCrawl } from "../floor/IAutoMovieMotionHumanCrawl";
import type { IAutoMovieMotionHumanPushPull } from "../handling/IAutoMovieMotionHumanPushPull";
import type { IAutoMovieMotionHumanJump } from "../next/IAutoMovieMotionHumanJump";
import type { IAutoMovieMotionHumanClimbStairs } from "../terrain/IAutoMovieMotionHumanClimbStairs";
import type { IAutoMovieMotionHumanChainCore } from "./IAutoMovieMotionHumanChainCore";

/**
 * The chain methods of standing and travelling: quiet standing, the gaits
 * over the floor, and travel over stairs, a ladder, an obstacle and the
 * floor itself.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The travel actions only; the other families extend it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export interface IAutoMovieMotionHumanChainTravel extends IAutoMovieMotionHumanChainCore {
  /**
   * Stand quietly.
   *
   * @param params How long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.stand: Stand quietly.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.stand is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.stand is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.stand is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.stand is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.stand is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.stand is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  stand(params?: IAutoMovieMotionHumanStand.IParams, anchor?: string): this;

  /**
   * Walk to a floor point.
   *
   * @param params Destination and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.walk: Walk to a floor point.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.walk is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.walk is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.walk is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.walk is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.walk is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.walk is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  walk(params: IAutoMovieMotionHumanWalkParams, anchor?: string): this;

  /**
   * Run to a floor point at a jog, a run or a sprint.
   *
   * @param params Destination, pace and path.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.run: Run to a floor point at a jog, a run or a sprint.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.run is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.run is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.run is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.run is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.run is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.run is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  run(params: IAutoMovieMotionHumanRun.IParams, anchor?: string): this;

  /**
   * Jump to a floor point: push off a planted foot, fly and land on both feet.
   *
   * @param params Where to land and the flight's apex.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.jump: Jump to a floor point: push off a planted foot, fly and land on both feet.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.jump is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.jump is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.jump is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.jump is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.jump is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.jump is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  jump(params: IAutoMovieMotionHumanJump.IParams, anchor?: string): this;

  /**
   * Walk up to a person, prop or point and stop at an interpersonal gap.
   *
   * @param params Target, gap and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.approach: Walk up to a person, prop or point and stop at an interpersonal gap.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.approach is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.approach is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.approach is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.approach is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.approach is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.approach is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  approach(
    params: IAutoMovieMotionHumanApproach.IParams,
    anchor?: string,
  ): this;

  /**
   * Walk while carrying a load in one hand, a box in both, a child on the
   * hip, or pushing a cart.
   *
   * @param params Destination, how the load is carried and its mass.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.carry: Walk while carrying a load in one hand, a box in both, a child on the hip, or pushing a cart.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.carry is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.carry is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.carry is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.carry is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.carry is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.carry is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  carry(params: IAutoMovieMotionHumanCarry.IParams, anchor?: string): this;

  /**
   * Move a heavy load by its two handles: push it ahead, pull it walking
   * backward or drag it behind, or press it and not move it.
   *
   * @param params The load, its handles, the way, where to and the load's level.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.pushPull: Move a heavy load by its two handles: push it ahead, pull it walking backward or drag it behind, or press it and not move it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.pushPull is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.pushPull is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.pushPull is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.pushPull is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.pushPull is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.pushPull is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  pushPull(
    params: IAutoMovieMotionHumanPushPull.IParams,
    anchor?: string,
  ): this;

  /**
   * Climb a flight of stairs up or down, step over step or step by step.
   *
   * @param params The flight (treads, riser, tread depth, direction), the stepping pattern and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.climbStairs: Climb a flight of stairs up or down, step over step or step by step.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.climbStairs is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.climbStairs is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.climbStairs is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.climbStairs is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.climbStairs is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.climbStairs is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  climbStairs(
    params: IAutoMovieMotionHumanClimbStairs.IParams,
    anchor?: string,
  ): this;

  /**
   * Step over a low obstacle ahead, lead foot then trail foot.
   *
   * @param params The obstacle and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.stepOver: Step over a low obstacle ahead, lead foot then trail foot.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.stepOver is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.stepOver is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.stepOver is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.stepOver is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.stepOver is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.stepOver is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  stepOver(
    params: IAutoMovieMotionHumanStepOver.IParams,
    anchor?: string,
  ): this;

  /**
   * Get down onto hands and knees and crawl in the diagonal pattern, crawl on
   * the hands and feet with the knees off the floor (`bear`), or walk the
   * hands out to a plank and the feet in to them (`inchworm`).
   *
   * @param params How many cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.crawl: Get down onto hands and knees and crawl in the diagonal pattern, crawl on the hands and feet with the knees off the floor (`bear`), or walk the hands out to a plank and the feet in to them (`inchworm`).
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.crawl is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.crawl is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.crawl is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.crawl is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.crawl is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.crawl is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  crawl(params?: IAutoMovieMotionHumanCrawl.IParams, anchor?: string): this;

  /**
   * Climb a fixed ladder in the four-beat pattern, three limbs always on it.
   *
   * @param params The ladder, a fixture prop of the scene, and the rungs climbed.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainTravel.climbLadder: Climb a fixed ladder in the four-beat pattern, three limbs always on it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainTravel.climbLadder is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainTravel.climbLadder is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainTravel.climbLadder is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainTravel.climbLadder is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainTravel.climbLadder is used through packages/motions/src/chain/HumanChainTravel.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainTravel.climbLadder is used through packages/motions/src/chain/HumanChainTravel.ts.
   */
  climbLadder(
    params: IAutoMovieMotionHumanClimbLadder.IParams,
    anchor?: string,
  ): this;
}
