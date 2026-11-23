import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanKnockdown } from "../reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "../reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanChainManual } from "./IAutoMovieMotionHumanChainManual";

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
export interface IAutoMovieMotionHumanChainStriking extends IAutoMovieMotionHumanChainManual {
  /**
   * Take and hold the fighting stance with the gloves up.
   *
   * @param params Stance, facing and time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.guard: Take and hold the fighting stance with the gloves up.
   */
  guard(params?: IAutoMovieMotionHumanGuard.IParams, anchor?: string): this;

  /**
   * Step in the fighting stance, keeping the stance.
   *
   * @param params Direction, count and length.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.step: Step in the fighting stance, keeping the stance.
   */
  step(params: IAutoMovieMotionHumanStep.IParams, anchor?: string): this;

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.punch: Bring a straight, hook or uppercut onto a target, or feint one.
   */
  punch(params: IAutoMovieMotionHumanPunch.IParams, anchor?: string): this;

  /**
   * Bring a round kick's shin or a push kick's foot onto a target, or feint
   * one.
   *
   * @param params Leg, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.kick: Bring a round kick's shin or a push kick's foot onto a target, or feint one.
   */
  kick(params: IAutoMovieMotionHumanKick.IParams, anchor?: string): this;

  /**
   * Drive a knee onto a target, in the clinch or free.
   *
   * @param params The target and the leg.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.knee: Drive a knee onto a target, in the clinch or free.
   */
  knee(params: IAutoMovieMotionHumanKnee.IParams, anchor?: string): this;

  /**
   * Take and hold a clinch grip on a partner: the neck tie, or collar and
   * sleeve.
   *
   * @param params The partner, the grip, the hand and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.clinch: Take and hold a clinch grip on a partner: the neck tie, or collar and sleeve.
   */
  clinch(params: IAutoMovieMotionHumanClinch.IParams, anchor?: string): this;

  /**
   * Defend against one placed strike: a cover, parry, block, check or
   * evasion.
   *
   * @param params The attack answered and the defence.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.defend: Defend against one placed strike: a cover, parry, block, check or evasion.
   */
  defend(params: IAutoMovieMotionHumanDefend.IParams, anchor?: string): this;

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.brace: Brace for an expected impact, push or falling body.
   */
  brace(params?: IAutoMovieMotionHumanBrace.IParams, anchor?: string): this;

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat and its intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.flinch: Startle away from a threat or a blow.
   */
  flinch(params?: IAutoMovieMotionHumanFlinch.IParams, anchor?: string): this;

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.stagger: Take one unplanned capture step after a push.
   */
  stagger(params: IAutoMovieMotionHumanStagger.IParams, anchor?: string): this;

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.knockdown: Let the legs give way and go down to lie supine.
   */
  knockdown(
    params?: IAutoMovieMotionHumanKnockdown.IParams,
    anchor?: string,
  ): this;

  /**
   * Respond to the impulses on the body: absorb, step or fall as the
   * impulse decides, or as the author fixes (#3430).
   *
   * @param params The outcome; decided by the impulse when absent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.perturb: Respond to the impulses on the body: absorb, step or fall as the impulse decides, or as the author fixes (#3430).
   */
  perturb(params?: IAutoMovieMotionHumanPerturb.IParams, anchor?: string): this;
}
