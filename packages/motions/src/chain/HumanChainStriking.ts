import type {
  IAutoMovieMotionHumanBrace,
  IAutoMovieMotionHumanClinch,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanDefend,
  IAutoMovieMotionHumanFlinch,
  IAutoMovieMotionHumanFootStrike,
  IAutoMovieMotionHumanGive,
  IAutoMovieMotionHumanGuard,
  IAutoMovieMotionHumanKick,
  IAutoMovieMotionHumanKnee,
  IAutoMovieMotionHumanKnockdown,
  IAutoMovieMotionHumanPerturb,
  IAutoMovieMotionHumanPunch,
  IAutoMovieMotionHumanStagger,
  IAutoMovieMotionHumanStep,
} from "@automovie/interface";

import { HumanChainHostage } from "./HumanChainHostage";

/**
 * The chain methods of a fight and of what a force does to a body: the guard
 * and its footwork, the strikes, the clinch, the defences, and the reactions to
 * a threat, a push or a blow.
 */
export class HumanChainStriking extends HumanChainHostage {
  /**
   * Take and hold the fighting stance with the gloves up.
   *
   * @param params Stance, facing and time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public guard(
    params: IAutoMovieMotionHumanGuard.IParams = {},
    anchor?: string,
  ): this {
    return this.act("guard", params, anchor);
  }

  /**
   * Step in the fighting stance, keeping the stance.
   *
   * @param params Direction, count and length.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public step(
    params: IAutoMovieMotionHumanStep.IParams,
    anchor?: string,
  ): this {
    return this.act("step", params, anchor);
  }

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public punch(
    params: IAutoMovieMotionHumanPunch.IParams,
    anchor?: string,
  ): this {
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
  public kick(
    params: IAutoMovieMotionHumanKick.IParams,
    anchor?: string,
  ): this {
    return this.act("kick", params, anchor);
  }

  /**
   * Drive a knee onto a target, in the clinch or free.
   *
   * @param params The target and the leg.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knee(
    params: IAutoMovieMotionHumanKnee.IParams,
    anchor?: string,
  ): this {
    return this.act("knee", params, anchor);
  }

  /**
   * Bring the point of the elbow, the back of a spinning fist or the forehead
   * onto a target inside the punch's range.
   *
   * @param params The technique, the target, the arm and the feint.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public closeStrike(
    params: IAutoMovieMotionHumanCloseStrike.IParams,
    anchor?: string,
  ): this {
    return this.act("closeStrike", params, anchor);
  }

  /**
   * Bring the heel, the sole or the blade of the foot onto a target through a
   * chamber, beyond the round and push kicks, and recoil to the stance.
   *
   * @param params The technique, the target, the leg, the spin and the jump.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public footStrike(
    params: IAutoMovieMotionHumanFootStrike.IParams,
    anchor?: string,
  ): this {
    return this.act("footStrike", params, anchor);
  }

  /**
   * Take and hold a clinch grip on a partner: the neck tie, or collar and
   * sleeve.
   *
   * @param params The partner, the grip, the hand and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public clinch(
    params: IAutoMovieMotionHumanClinch.IParams,
    anchor?: string,
  ): this {
    return this.act("clinch", params, anchor);
  }

  /**
   * Defend against one placed strike: a cover, parry, block, check or evasion.
   *
   * @param params The attack answered and the defence.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public defend(
    params: IAutoMovieMotionHumanDefend.IParams,
    anchor?: string,
  ): this {
    return this.act("defend", params, anchor);
  }

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public brace(
    params: IAutoMovieMotionHumanBrace.IParams = {},
    anchor?: string,
  ): this {
    return this.act("brace", params, anchor);
  }

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat and its intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public flinch(
    params: IAutoMovieMotionHumanFlinch.IParams = {},
    anchor?: string,
  ): this {
    return this.act("flinch", params, anchor);
  }

  /**
   * Give way to a contact: the head turned aside by a slap, or the trunk
   * carried by a hand that pushes or pulls, then a return.
   *
   * @param params The contact's target, part, way and intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public give(
    params: IAutoMovieMotionHumanGive.IParams = {},
    anchor?: string,
  ): this {
    return this.act("give", params, anchor);
  }

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stagger(
    params: IAutoMovieMotionHumanStagger.IParams,
    anchor?: string,
  ): this {
    return this.act("stagger", params, anchor);
  }

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knockdown(
    params: IAutoMovieMotionHumanKnockdown.IParams = {},
    anchor?: string,
  ): this {
    return this.act("knockdown", params, anchor);
  }

  /**
   * Respond to the impulses on the body: absorb, step or fall as the impulse
   * decides, or as the author fixes.
   *
   * @param params The outcome; decided by the impulse when absent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public perturb(
    params: IAutoMovieMotionHumanPerturb.IParams = {},
    anchor?: string,
  ): this {
    return this.act("perturb", params, anchor);
  }
}
