import type { brace } from "../everyday/brace";
import type { clinch } from "../grappling/clinch";
import type { flinch } from "../reaction/flinch";
import type { knockdown } from "../reaction/knockdown";
import type { stagger } from "../reaction/stagger";
import type { defend } from "../striking/defend";
import type { guard } from "../striking/guard";
import type { kick } from "../striking/kick";
import type { knee } from "../striking/knee";
import type { punch } from "../striking/punch";
import type { step } from "../striking/step";
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
  public guard(params: guard.IParams = {}, anchor?: string): this {
    return this.act("guard", params, anchor);
  }

  /**
   * Step in the fighting stance, keeping the stance.
   *
   * @param params Direction, count and length.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public step(params: step.IParams, anchor?: string): this {
    return this.act("step", params, anchor);
  }

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public punch(params: punch.IParams, anchor?: string): this {
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
  public kick(params: kick.IParams, anchor?: string): this {
    return this.act("kick", params, anchor);
  }

  /**
   * Drive a knee onto a target, in the clinch or free.
   *
   * @param params The target and the leg.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knee(params: knee.IParams, anchor?: string): this {
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
  public clinch(params: clinch.IParams, anchor?: string): this {
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
  public defend(params: defend.IParams, anchor?: string): this {
    return this.act("defend", params, anchor);
  }

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public brace(params: brace.IParams = {}, anchor?: string): this {
    return this.act("brace", params, anchor);
  }

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat and its intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public flinch(params: flinch.IParams = {}, anchor?: string): this {
    return this.act("flinch", params, anchor);
  }

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stagger(params: stagger.IParams, anchor?: string): this {
    return this.act("stagger", params, anchor);
  }

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public knockdown(params: knockdown.IParams = {}, anchor?: string): this {
    return this.act("knockdown", params, anchor);
  }
}
