import type { IAutoMovieMotionHumanCatchObject } from "../throwing/IAutoMovieMotionHumanCatchObject";
import type { IAutoMovieMotionHumanChainStriking } from "./IAutoMovieMotionHumanChainStriking";
import type { IAutoMovieMotionHumanHandoverAction } from "../handling/IAutoMovieMotionHumanHandoverAction";
import type { IAutoMovieMotionHumanHandshake } from "../handling/IAutoMovieMotionHumanHandshake";
import type { IAutoMovieMotionHumanHighFive } from "../touch/IAutoMovieMotionHumanHighFive";
import type { IAutoMovieMotionHumanKickBall } from "../ballStrike/IAutoMovieMotionHumanKickBall";
import type { IAutoMovieMotionHumanKiss } from "../touch/IAutoMovieMotionHumanKiss";
import type { IAutoMovieMotionHumanPickUp } from "../handling/IAutoMovieMotionHumanPickUp";
import type { IAutoMovieMotionHumanPutDown } from "../handling/IAutoMovieMotionHumanPutDown";
import type { IAutoMovieMotionHumanReceive } from "../handling/IAutoMovieMotionHumanReceive";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * The chain methods a person performs with a partner or on an object: the
 * handshake, the high five and the kiss, a prop picked up, put down, handed
 * over and received, and an object thrown, caught or kicked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The partner and object actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export interface IAutoMovieMotionHumanChainMutual extends IAutoMovieMotionHumanChainStriking {
  /**
   * Shake hands with a partner standing within reach; `HumanChain.pair`
   * appends both partners' handshakes together.
   *
   * @param params The partner, the hand and the pump count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  handshake(
    params: IAutoMovieMotionHumanHandshake.IParams,
    anchor?: string,
  ): this;

  /**
   * Meet a partner's hand at one shared point and instant.
   *
   * @param params The partner, the kind and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  highFive(
    params: IAutoMovieMotionHumanHighFive.IParams,
    anchor?: string,
  ): this;

  /**
   * Bring the lips to a partner's region by a lean and a neck flexion; the
   * arms stay free for a layer.
   *
   * @param params The partner, the region, the side and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  kiss(params: IAutoMovieMotionHumanKiss.IParams, anchor?: string): this;

  /**
   * Reach for a prop's grip affordance, grasp it and lift it.
   *
   * @param params The prop, its grip, the hand and the lift.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  pickUp(params: IAutoMovieMotionHumanPickUp.IParams, anchor?: string): this;

  /**
   * Set a held prop down at a place and let go.
   *
   * @param params The prop, where it goes and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  putDown(params: IAutoMovieMotionHumanPutDown.IParams, anchor?: string): this;

  /**
   * Hand a held prop to a receiver, letting go only after the receiver's
   * grip closes; `HumanChain.pair` appends both roles together.
   *
   * @param params The prop, the receiver, the grip and the hands.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  handOver(
    params: IAutoMovieMotionHumanHandoverAction.IParams,
    anchor?: string,
  ): this;

  /**
   * Take a prop a giver holds out; `HumanChain.pair` appends both roles
   * together.
   *
   * @param params The prop, the giver, the grip and the hands.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  receive(params: IAutoMovieMotionHumanReceive.IParams, anchor?: string): this;

  /**
   * Throw a held object overarm, underarm or as a toss along a ballistic
   * path to a target.
   *
   * @param params The target, the style and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  throwObject(
    params: IAutoMovieMotionHumanThrowObjectParams,
    anchor?: string,
  ): this;

  /**
   * Catch a thrown object where its path enters the reach, give with it and
   * hold it.
   *
   * @param params The throw answered, the hands and the object's radius.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  catchObject(
    params: IAutoMovieMotionHumanCatchObject.IParams,
    anchor?: string,
  ): this;

  /**
   * Open a hand on what it holds: the prop leaves with the hand's velocity,
   * or a prop on a launcher leaves at the launcher's speed.
   *
   * @param params The hand, the prop and a launcher's launch.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  release(params?: IAutoMovieMotionHumanRelease.IParams, anchor?: string): this;

  /**
   * Kick a ball beside the support foot with the instep.
   *
   * @param params The ball, the foot and where it is sent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  kickBall(
    params: IAutoMovieMotionHumanKickBall.IParams,
    anchor?: string,
  ): this;
}
