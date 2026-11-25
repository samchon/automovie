import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanGive } from "../reaction/IAutoMovieMotionHumanGive";
import type { IAutoMovieMotionHumanKnockdown } from "../reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "../reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanFootStrike } from "../striking/IAutoMovieMotionHumanFootStrike";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanChainManual } from "./IAutoMovieMotionHumanChainManual";

/**
 * The chain methods of a fight and of what a force does to a body: the guard
 * and its footwork, the strikes, the clinch, the defences, and the reactions to
 * a threat, a push or a blow.
 */
export interface IAutoMovieMotionHumanChainStriking extends IAutoMovieMotionHumanChainManual {
  /**
   * Take and hold the fighting stance with the gloves up.
   *
   * @param params Stance, facing and time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  guard(params?: IAutoMovieMotionHumanGuard.IParams, anchor?: string): this;

  /**
   * Step in the fighting stance, keeping the stance.
   *
   * @param params Direction, count and length.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  step(params: IAutoMovieMotionHumanStep.IParams, anchor?: string): this;

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  punch(params: IAutoMovieMotionHumanPunch.IParams, anchor?: string): this;

  /**
   * Bring a round kick's shin or a push kick's foot onto a target, or feint
   * one.
   *
   * @param params Leg, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  kick(params: IAutoMovieMotionHumanKick.IParams, anchor?: string): this;

  /**
   * Drive a knee onto a target, in the clinch or free.
   *
   * @param params The target and the leg.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  knee(params: IAutoMovieMotionHumanKnee.IParams, anchor?: string): this;

  /**
   * Bring the point of the elbow, the back of a spinning fist or the forehead
   * onto a target inside the punch's range.
   *
   * @param params The technique, the target, the arm and the feint.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  closeStrike(
    params: IAutoMovieMotionHumanCloseStrike.IParams,
    anchor?: string,
  ): this;

  /**
   * Bring the heel, the sole or the blade of the foot onto a target through a
   * chamber, beyond the round and push kicks, and recoil to the stance.
   *
   * @param params The technique, the target, the leg, the spin and the jump.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  footStrike(
    params: IAutoMovieMotionHumanFootStrike.IParams,
    anchor?: string,
  ): this;

  /**
   * Take and hold a clinch grip on a partner: the neck tie, or collar and
   * sleeve.
   *
   * @param params The partner, the grip, the hand and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  clinch(params: IAutoMovieMotionHumanClinch.IParams, anchor?: string): this;

  /**
   * Defend against one placed strike: a cover, parry, block, check or evasion.
   *
   * @param params The attack answered and the defence.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  defend(params: IAutoMovieMotionHumanDefend.IParams, anchor?: string): this;

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  brace(params?: IAutoMovieMotionHumanBrace.IParams, anchor?: string): this;

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat and its intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  flinch(params?: IAutoMovieMotionHumanFlinch.IParams, anchor?: string): this;

  /**
   * Give way to a contact: the head turned aside by a slap, or the trunk
   * carried by a hand that pushes or pulls, then a return.
   *
   * @param params The contact's target, part, way and intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  give(params?: IAutoMovieMotionHumanGive.IParams, anchor?: string): this;

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  stagger(params: IAutoMovieMotionHumanStagger.IParams, anchor?: string): this;

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  knockdown(
    params?: IAutoMovieMotionHumanKnockdown.IParams,
    anchor?: string,
  ): this;

  /**
   * Respond to the impulses on the body: absorb, step or fall as the impulse
   * decides, or as the author fixes.
   *
   * @param params The outcome; decided by the impulse when absent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  perturb(params?: IAutoMovieMotionHumanPerturb.IParams, anchor?: string): this;
}
