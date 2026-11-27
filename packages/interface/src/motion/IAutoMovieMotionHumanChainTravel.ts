import type { IAutoMovieMotionHumanRun } from "./IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanStand } from "./IAutoMovieMotionHumanStand";
import type { IAutoMovieMotionHumanWalkParams } from "./IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanCarry } from "./IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanClimbLadder } from "./IAutoMovieMotionHumanClimbLadder";
import type { IAutoMovieMotionHumanApproach } from "./IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanStepOver } from "./IAutoMovieMotionHumanStepOver";
import type { IAutoMovieMotionHumanCrawl } from "./IAutoMovieMotionHumanCrawl";
import type { IAutoMovieMotionHumanPushPull } from "./IAutoMovieMotionHumanPushPull";
import type { IAutoMovieMotionHumanJump } from "./IAutoMovieMotionHumanJump";
import type { IAutoMovieMotionHumanClimbStairs } from "./IAutoMovieMotionHumanClimbStairs";
import type { IAutoMovieMotionHumanChainCore } from "./IAutoMovieMotionHumanChainCore";

/**
 * The chain methods of standing and travelling: quiet standing, the gaits over
 * the floor, and travel over stairs, a ladder, an obstacle and the floor
 * itself.
 */
export interface IAutoMovieMotionHumanChainTravel extends IAutoMovieMotionHumanChainCore {
  /**
   * Stand quietly.
   *
   * @param params How long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  stand(params?: IAutoMovieMotionHumanStand.IParams, anchor?: string): this;

  /**
   * Walk to a floor point.
   *
   * @param params Destination and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  walk(params: IAutoMovieMotionHumanWalkParams, anchor?: string): this;

  /**
   * Run to a floor point at a jog, a run or a sprint.
   *
   * @param params Destination, pace and path.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  run(params: IAutoMovieMotionHumanRun.IParams, anchor?: string): this;

  /**
   * Jump to a floor point: push off a planted foot, fly and land on both feet.
   *
   * @param params Where to land and the flight's apex.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  jump(params: IAutoMovieMotionHumanJump.IParams, anchor?: string): this;

  /**
   * Walk up to a person, prop or point and stop at an interpersonal gap.
   *
   * @param params Target, gap and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  approach(
    params: IAutoMovieMotionHumanApproach.IParams,
    anchor?: string,
  ): this;

  /**
   * Walk while carrying a load in one hand, a box in both, a child on the hip,
   * or pushing a cart.
   *
   * @param params Destination, how the load is carried and its mass.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  carry(params: IAutoMovieMotionHumanCarry.IParams, anchor?: string): this;

  /**
   * Move a heavy load by its two handles: push it ahead, pull it walking
   * backward or drag it behind, or press it and not move it.
   *
   * @param params The load, its handles, the way, where to and the load's
   *   level.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  pushPull(
    params: IAutoMovieMotionHumanPushPull.IParams,
    anchor?: string,
  ): this;

  /**
   * Climb a flight of stairs up or down, step over step or step by step.
   *
   * @param params The flight (treads, riser, tread depth, direction), the
   *   stepping pattern and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
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
   */
  stepOver(
    params: IAutoMovieMotionHumanStepOver.IParams,
    anchor?: string,
  ): this;

  /**
   * Get down onto hands and knees and crawl in the diagonal pattern, crawl on
   * the hands and feet with the knees off the floor (`bear`), or walk the hands
   * out to a plank and the feet in to them (`inchworm`).
   *
   * @param params How many cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  crawl(params?: IAutoMovieMotionHumanCrawl.IParams, anchor?: string): this;

  /**
   * Climb a fixed ladder in the four-beat pattern, three limbs always on it.
   *
   * @param params The ladder, a fixture prop of the scene, and the rungs
   *   climbed.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  climbLadder(
    params: IAutoMovieMotionHumanClimbLadder.IParams,
    anchor?: string,
  ): this;
}
