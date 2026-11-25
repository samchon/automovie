import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanCrouch,
  IAutoMovieMotionHumanGetUp,
  IAutoMovieMotionHumanKneel,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanShift,
  IAutoMovieMotionHumanSit,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallClimb,
} from "@automovie/interface";

import { wallClimbSupport } from "../climbing/wallClimbSupport";
import { HumanChainTravel } from "./HumanChainTravel";

/**
 * The chain methods that change what the body rests on or how low it is: onto a
 * seat and off it, down to a low point, a crouch, a kneel and the floor.
 */
export class HumanChainPosture extends HumanChainTravel {
  /**
   * Sit down on a seat behind the performer.
   *
   * @param params The seat, the seated back and the time seated.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public sit(params: IAutoMovieMotionHumanSit.IParams, anchor?: string): this {
    return this.act("sit", params, anchor);
  }

  /**
   * Stand up from the seat the performer sits on.
   *
   * @param params Nothing: rising takes no parameter.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public rise(
    params: IAutoMovieMotionHumanRise.IParams = {},
    anchor?: string,
  ): this {
    return this.act("rise", params, anchor);
  }

  /**
   * Edge sideways along the seat.
   *
   * @param params Distance and time seated after.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public shift(
    params: IAutoMovieMotionHumanShift.IParams,
    anchor?: string,
  ): this {
    return this.act("shift", params, anchor);
  }

  /**
   * Bend down to bring a hand to a low point, feet planted.
   *
   * @param params Target, hand, strategy and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public bend(
    params: IAutoMovieMotionHumanBend.IParams,
    anchor?: string,
  ): this {
    return this.act("bend", params, anchor);
  }

  /**
   * Crouch or squat over the planted feet, hold, then stand again.
   *
   * @param params Depth, heels and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public crouch(
    params: IAutoMovieMotionHumanCrouch.IParams = {},
    anchor?: string,
  ): this {
    return this.act("crouch", params, anchor);
  }

  /**
   * Kneel on one knee, on both, or sit back on the heels, then rise.
   *
   * @param params The kind of kneel, the knee, the hold and whether to rise.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kneel(
    params: IAutoMovieMotionHumanKneel.IParams = {},
    anchor?: string,
  ): this {
    return this.act("kneel", params, anchor);
  }

  /**
   * Lie down on the floor from standing, supine, prone or on a side.
   *
   * @param params The lying position and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public lieDown(
    params: IAutoMovieMotionHumanLieDown.IParams = {},
    anchor?: string,
  ): this {
    return this.act("lieDown", params, anchor);
  }

  /**
   * Get up from the floor to standing: from the back, the front, or the hands
   * and knees.
   *
   * @param params The pattern, the leading foot and the manner.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public getUp(
    params: IAutoMovieMotionHumanGetUp.IParams = {},
    anchor?: string,
  ): this {
    return this.act("getUp", params, anchor);
  }

  /**
   * Move the body's weight across a sequence of supports, each stance's new
   * supports bearing before the old ones let go.
   *
   * @param params The stances and the surface a row's contacts touch.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public support(
    params: IAutoMovieMotionHumanSupport.IParams,
    anchor?: string,
  ): this {
    return this.act("support", params, anchor);
  }

  /**
   * Climb a wall on fixed holds: each stance of the route holds at least three
   * limbs on distinct holds, built by `wallClimbSupport` and moved through by
   * `support`.
   *
   * @param params The starting holds and the ordered one-limb changes.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public wallClimb(
    params: IAutoMovieMotionHumanWallClimb,
    anchor?: string,
  ): this {
    return this.support(wallClimbSupport(params), anchor);
  }
}
