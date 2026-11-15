import type { jump } from "../actions/jump";
import type { run } from "../actions/run";
import type { stand } from "../actions/stand";
import type { walk } from "../actions/walk";
import type { carry } from "../carrying/carry";
import type { climbLadder } from "../climbing/climbLadder";
import type { approach } from "../everyday/approach";
import type { stepOver } from "../everyday/stepOver";
import type { crawl } from "../floor/crawl";
import type { climbStairs } from "../terrain/climbStairs";
import { HumanChainCore } from "./HumanChainCore";

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
export class HumanChainTravel extends HumanChainCore {
  /**
   * Stand quietly.
   *
   * @param params How long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stand(params: stand.IParams = {}, anchor?: string): this {
    return this.act("stand", params, anchor);
  }

  /**
   * Walk to a floor point.
   *
   * @param params Destination and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public walk(params: walk.IParams, anchor?: string): this {
    return this.act("walk", params, anchor);
  }

  /**
   * Run to a floor point at a jog, a run or a sprint.
   *
   * @param params Destination, pace and path.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public run(params: run.IParams, anchor?: string): this {
    return this.act("run", params, anchor);
  }

  /**
   * Jump to a floor point: push off a planted foot, fly and land on both feet.
   *
   * @param params Where to land and the flight's apex.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public jump(params: jump.IParams, anchor?: string): this {
    return this.act("jump", params, anchor);
  }

  /**
   * Walk up to a person, prop or point and stop at an interpersonal gap.
   *
   * @param params Target, gap and pace.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public approach(params: approach.IParams, anchor?: string): this {
    return this.act("approach", params, anchor);
  }

  /**
   * Walk while carrying a load in one hand, a box in both, a child on the
   * hip, or pushing a cart.
   *
   * @param params Destination, how the load is carried and its mass.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public carry(params: carry.IParams, anchor?: string): this {
    return this.act("carry", params, anchor);
  }

  /**
   * Climb a flight of stairs up or down, step over step or step by step.
   *
   * @param params The flight (treads, riser, tread depth, direction), the stepping pattern and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public climbStairs(params: climbStairs.IParams, anchor?: string): this {
    return this.act("climbStairs", params, anchor);
  }

  /**
   * Step over a low obstacle ahead, lead foot then trail foot.
   *
   * @param params The obstacle and the leading foot.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stepOver(params: stepOver.IParams, anchor?: string): this {
    return this.act("stepOver", params, anchor);
  }

  /**
   * Get down onto hands and knees and crawl in the diagonal pattern, crawl on
   * the hands and feet with the knees off the floor (`bear`), or walk the
   * hands out to a plank and the feet in to them (`inchworm`).
   *
   * @param params How many cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public crawl(params: crawl.IParams = {}, anchor?: string): this {
    return this.act("crawl", params, anchor);
  }

  /**
   * Climb a fixed ladder in the four-beat pattern, three limbs always on it.
   *
   * @param params The ladder, a fixture prop of the scene, and the rungs climbed.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public climbLadder(params: climbLadder.IParams, anchor?: string): this {
    return this.act("climbLadder", params, anchor);
  }
}
