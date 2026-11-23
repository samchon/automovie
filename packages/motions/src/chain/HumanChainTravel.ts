import type {
  IAutoMovieMotionHumanApproach,
  IAutoMovieMotionHumanCarry,
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPushPull,
  IAutoMovieMotionHumanRun,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanStepOver,
  IAutoMovieMotionHumanWalkParams,
} from "@automovie/interface";

import { HumanChainCore } from "./HumanChainCore";

/**
 * The chain methods of standing and travelling: quiet standing, the gaits over
 * the floor, and travel over stairs, a ladder, an obstacle and the floor
 * itself.
 */
export class HumanChainTravel extends HumanChainCore {
  /**
   * Stand quietly.
   *
   * @param params How long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stand(
    params: IAutoMovieMotionHumanStand.IParams = {},
    anchor?: string,
  ): this {
    return this.act("stand", params, anchor);
  }

  /**
   * Walk to a floor point.
   *
   * @param params Destination and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public walk(params: IAutoMovieMotionHumanWalkParams, anchor?: string): this {
    return this.act("walk", params, anchor);
  }

  /**
   * Run to a floor point at a jog, a run or a sprint.
   *
   * @param params Destination, pace and path.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public run(params: IAutoMovieMotionHumanRun.IParams, anchor?: string): this {
    return this.act("run", params, anchor);
  }

  /**
   * Jump to a floor point: push off a planted foot, fly and land on both feet.
   *
   * @param params Where to land and the flight's apex.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public jump(
    params: IAutoMovieMotionHumanJump.IParams,
    anchor?: string,
  ): this {
    return this.act("jump", params, anchor);
  }

  /**
   * Walk up to a person, prop or point and stop at an interpersonal gap.
   *
   * @param params Target, gap and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public approach(
    params: IAutoMovieMotionHumanApproach.IParams,
    anchor?: string,
  ): this {
    return this.act("approach", params, anchor);
  }

  /**
   * Walk while carrying a load in one hand, a box in both, a child on the hip,
   * or pushing a cart.
   *
   * @param params Destination, how the load is carried and its mass.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public carry(
    params: IAutoMovieMotionHumanCarry.IParams,
    anchor?: string,
  ): this {
    return this.act("carry", params, anchor);
  }

  /**
   * Move a heavy load by its two handles: push it ahead, pull it walking
   * backward or drag it behind, or press it and not move it.
   *
   * @param params The load, its handles, the way, where to and the load's
   *   level.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public pushPull(
    params: IAutoMovieMotionHumanPushPull.IParams,
    anchor?: string,
  ): this {
    return this.act("pushPull", params, anchor);
  }

  /**
   * Climb a flight of stairs up or down, step over step or step by step.
   *
   * @param params The flight (treads, riser, tread depth, direction), the
   *   stepping pattern and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public climbStairs(
    params: IAutoMovieMotionHumanClimbStairs.IParams,
    anchor?: string,
  ): this {
    return this.act("climbStairs", params, anchor);
  }

  /**
   * Step over a low obstacle ahead, lead foot then trail foot.
   *
   * @param params The obstacle and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stepOver(
    params: IAutoMovieMotionHumanStepOver.IParams,
    anchor?: string,
  ): this {
    return this.act("stepOver", params, anchor);
  }

  /**
   * Get down onto hands and knees and crawl in the diagonal pattern, crawl on
   * the hands and feet with the knees off the floor (`bear`), or walk the hands
   * out to a plank and the feet in to them (`inchworm`).
   *
   * @param params How many cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public crawl(
    params: IAutoMovieMotionHumanCrawl.IParams = {},
    anchor?: string,
  ): this {
    return this.act("crawl", params, anchor);
  }

  /**
   * Climb a fixed ladder in the four-beat pattern, three limbs always on it.
   *
   * @param params The ladder, a fixture prop of the scene, and the rungs
   *   climbed.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public climbLadder(
    params: IAutoMovieMotionHumanClimbLadder.IParams,
    anchor?: string,
  ): this {
    return this.act("climbLadder", params, anchor);
  }
}
