import type { IAutoMovieMotionHumanBrace, IAutoMovieMotionHumanClinch, IAutoMovieMotionHumanDefend, IAutoMovieMotionHumanFlinch, IAutoMovieMotionHumanGuard, IAutoMovieMotionHumanKick, IAutoMovieMotionHumanKnee, IAutoMovieMotionHumanKnockdown, IAutoMovieMotionHumanPerturb, IAutoMovieMotionHumanPunch, IAutoMovieMotionHumanStagger, IAutoMovieMotionHumanStep } from "@automovie/interface";













import { HumanChainManual } from "./HumanChainManual";

/**
 * The chain methods of a fight and of what a force does to a body: the
 * guard and its footwork, the strikes, the clinch, the defences, and the
 * reactions to a threat, a push or a blow.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The striking, defence and reaction actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export class HumanChainStriking extends HumanChainManual {
  /**
   * Take and hold the fighting stance with the gloves up.
   *
   * @param params Stance, facing and time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public guard(params: IAutoMovieMotionHumanGuard.IParams = {}, anchor?: string): this {
    return this.act("guard", params, anchor);
  }

  /**
   * Step in the fighting stance, keeping the stance.
   *
   * @param params Direction, count and length.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public step(params: IAutoMovieMotionHumanStep.IParams, anchor?: string): this {
    return this.act("step", params, anchor);
  }

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public punch(params: IAutoMovieMotionHumanPunch.IParams, anchor?: string): this {
    return this.act("punch", params, anchor);
  }

  /**
   * Bring a round kick's shin or a push kick's foot onto a target, or feint
   * one.
   *
   * @param params Leg, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kick(params: IAutoMovieMotionHumanKick.IParams, anchor?: string): this {
    return this.act("kick", params, anchor);
  }

  /**
   * Drive a knee onto a target, in the clinch or free.
   *
   * @param params The target and the leg.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knee(params: IAutoMovieMotionHumanKnee.IParams, anchor?: string): this {
    return this.act("knee", params, anchor);
  }

  /**
   * Take and hold a clinch grip on a partner: the neck tie, or collar and
   * sleeve.
   *
   * @param params The partner, the grip, the hand and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public clinch(params: IAutoMovieMotionHumanClinch.IParams, anchor?: string): this {
    return this.act("clinch", params, anchor);
  }

  /**
   * Defend against one placed strike: a cover, parry, block, check or
   * evasion.
   *
   * @param params The attack answered and the defence.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public defend(params: IAutoMovieMotionHumanDefend.IParams, anchor?: string): this {
    return this.act("defend", params, anchor);
  }

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public brace(params: IAutoMovieMotionHumanBrace.IParams = {}, anchor?: string): this {
    return this.act("brace", params, anchor);
  }

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat and its intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public flinch(params: IAutoMovieMotionHumanFlinch.IParams = {}, anchor?: string): this {
    return this.act("flinch", params, anchor);
  }

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stagger(params: IAutoMovieMotionHumanStagger.IParams, anchor?: string): this {
    return this.act("stagger", params, anchor);
  }

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knockdown(params: IAutoMovieMotionHumanKnockdown.IParams = {}, anchor?: string): this {
    return this.act("knockdown", params, anchor);
  }

  /**
   * Respond to the impulses on the body: absorb, step or fall as the
   * impulse decides, or as the author fixes (#3430).
   *
   * @param params The outcome; decided by the impulse when absent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public perturb(params: IAutoMovieMotionHumanPerturb.IParams = {}, anchor?: string): this {
    return this.act("perturb", params, anchor);
  }
}
