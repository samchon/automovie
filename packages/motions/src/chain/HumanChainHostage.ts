import type {
  IAutoMovieMotionHumanDisarm,
  IAutoMovieMotionHumanHostageHold,
} from "@automovie/interface";

import { HumanChainManual } from "./HumanChainManual";

/**
 * The chain methods of a hostage scene: the hold from behind, the hostage's
 * walk back with the holder, the disarm of a knife or a handgun and the armed
 * partner's hand giving the weapon up.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hostage and disarm actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export class HumanChainHostage extends HumanChainManual {
  /**
   * Take a knife or a handgun from a resisting partner.
   *
   * @param params The partner, the prop, the kind, the hand and the lever.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public disarm(
    params: IAutoMovieMotionHumanDisarm.IParams,
    anchor?: string,
  ): this {
    return this.registered("disarm", params, anchor);
  }

  /**
   * The armed partner's hand gives the weapon up at the defender's take.
   *
   * @param params The defender and the anchor of its disarm.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public disarmed(
    params: IAutoMovieMotionHumanDisarm.IYield,
    anchor?: string,
  ): this {
    return this.registered("disarmed", params, anchor);
  }

  /**
   * Hold a hostage from behind: a free arm across the chest or neck, a held
   * weapon presented at the head or throat, the pair walking backward.
   *
   * @param params The partner, the arm, the prop, the point, the region, the back distance and the duration.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public hostageHold(
    params: IAutoMovieMotionHumanHostageHold.IParams,
    anchor?: string,
  ): this {
    return this.registered("hostageHold", params, anchor);
  }

  /**
   * Be the hostage of a hold: keep the posture and walk backward with the
   * holder.
   *
   * @param params The holder.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public heldHostage(
    params: IAutoMovieMotionHumanHostageHold.IHeld,
    anchor?: string,
  ): this {
    return this.registered("heldHostage", params, anchor);
  }
}
