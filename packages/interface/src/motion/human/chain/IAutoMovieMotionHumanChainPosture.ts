import type { IAutoMovieMotionHumanWallClimb } from "../climbing/IAutoMovieMotionHumanWallClimb";
import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanShift } from "../everyday/IAutoMovieMotionHumanShift";
import type { IAutoMovieMotionHumanSit } from "../everyday/IAutoMovieMotionHumanSit";
import type { IAutoMovieMotionHumanGetUp } from "../floor/IAutoMovieMotionHumanGetUp";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanSupport } from "../next/IAutoMovieMotionHumanSupport";
import type { IAutoMovieMotionHumanChainTravel } from "./IAutoMovieMotionHumanChainTravel";

/**
 * The chain methods that change what the body rests on or how low it is: onto a
 * seat and off it, down to a low point, a crouch, a kneel and the floor.
 */
export interface IAutoMovieMotionHumanChainPosture extends IAutoMovieMotionHumanChainTravel {
  /**
   * Sit down on a seat behind the performer.
   *
   * @param params The seat, the seated back and the time seated.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  sit(params: IAutoMovieMotionHumanSit.IParams, anchor?: string): this;

  /**
   * Stand up from the seat the performer sits on.
   *
   * @param params Nothing: rising takes no parameter.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  rise(params?: IAutoMovieMotionHumanRise.IParams, anchor?: string): this;

  /**
   * Edge sideways along the seat.
   *
   * @param params Distance and time seated after.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  shift(params: IAutoMovieMotionHumanShift.IParams, anchor?: string): this;

  /**
   * Bend down to bring a hand to a low point, feet planted.
   *
   * @param params Target, hand, strategy and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  bend(params: IAutoMovieMotionHumanBend.IParams, anchor?: string): this;

  /**
   * Crouch or squat over the planted feet, hold, then stand again.
   *
   * @param params Depth, heels and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  crouch(params?: IAutoMovieMotionHumanCrouch.IParams, anchor?: string): this;

  /**
   * Kneel on one knee, on both, or sit back on the heels, then rise.
   *
   * @param params The kind of kneel, the knee, the hold and whether to rise.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  kneel(params?: IAutoMovieMotionHumanKneel.IParams, anchor?: string): this;

  /**
   * Lie down on the floor from standing, supine, prone or on a side.
   *
   * @param params The lying position and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  lieDown(params?: IAutoMovieMotionHumanLieDown.IParams, anchor?: string): this;

  /**
   * Get up from the floor to standing: from the back, the front, or the hands
   * and knees.
   *
   * @param params The pattern, the leading foot and the manner.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  getUp(params?: IAutoMovieMotionHumanGetUp.IParams, anchor?: string): this;

  /**
   * Move the body's weight across a sequence of supports, each stance's new
   * supports bearing before the old ones let go.
   *
   * @param params The stances and the surface a row's contacts touch.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  support(params: IAutoMovieMotionHumanSupport.IParams, anchor?: string): this;

  /**
   * Climb a wall on fixed holds: each stance of the route holds at least three
   * limbs on distinct holds, built by `wallClimbSupport` and moved through by
   * `support`.
   *
   * @param params The starting holds and the ordered one-limb changes.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  wallClimb(params: IAutoMovieMotionHumanWallClimb, anchor?: string): this;
}
