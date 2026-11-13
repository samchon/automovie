import type { bend } from "../everyday/bend";
import type { crouch } from "../everyday/crouch";
import type { kneel } from "../everyday/kneel";
import type { rise } from "../everyday/rise";
import type { shift } from "../everyday/shift";
import type { sit } from "../everyday/sit";
import type { lieDown } from "../floor/lieDown";
import { HumanChainTravel } from "./HumanChainTravel";

/**
 * The chain methods that change what the body rests on or how low it is:
 * onto a seat and off it, down to a low point, a crouch, a kneel and the
 * floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The posture actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export class HumanChainPosture extends HumanChainTravel {
  /**
   * Sit down on a seat behind the performer.
   *
   * @param params The seat, the seated back and the time seated.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public sit(params: sit.IParams, anchor?: string): this {
    return this.act("sit", params, anchor);
  }

  /**
   * Stand up from the seat the performer sits on.
   *
   * @param params Nothing: rising takes no parameter.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public rise(params: rise.IParams = {}, anchor?: string): this {
    return this.act("rise", params, anchor);
  }

  /**
   * Edge sideways along the seat.
   *
   * @param params Distance and time seated after.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public shift(params: shift.IParams, anchor?: string): this {
    return this.act("shift", params, anchor);
  }

  /**
   * Bend down to bring a hand to a low point, feet planted.
   *
   * @param params Target, hand, strategy and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public bend(params: bend.IParams, anchor?: string): this {
    return this.act("bend", params, anchor);
  }

  /**
   * Crouch or squat over the planted feet, hold, then stand again.
   *
   * @param params Depth, heels and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public crouch(params: crouch.IParams = {}, anchor?: string): this {
    return this.act("crouch", params, anchor);
  }

  /**
   * Kneel on one knee, on both, or sit back on the heels, then rise.
   *
   * @param params The kind of kneel, the knee, the hold and whether to rise.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kneel(params: kneel.IParams = {}, anchor?: string): this {
    return this.act("kneel", params, anchor);
  }

  /**
   * Lie down on the floor from standing, supine, prone or on a side.
   *
   * @param params The lying position and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public lieDown(params: lieDown.IParams = {}, anchor?: string): this {
    return this.act("lieDown", params, anchor);
  }
}
