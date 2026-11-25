import type {
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanFirefighting,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanHandshake,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionHumanKickBall,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanReceive,
  IAutoMovieMotionHumanRelease,
  IAutoMovieMotionHumanThrowObjectParams,
} from "@automovie/interface";

import { HumanChainStriking } from "./HumanChainStriking";

/** The extinguisher's safety pin's pull, metres: `createFireExtinguisher`'s. */
const PIN: number = 0.04;

/**
 * The chain methods a person performs with a partner or on an object: the
 * handshake, the high five and the kiss, a prop picked up, put down, handed
 * over and received, and an object thrown, caught or kicked.
 */
export class HumanChainMutual extends HumanChainStriking {
  /**
   * Shake hands with a partner standing within reach; `HumanChain.pair` appends
   * both partners' handshakes together.
   *
   * @param params The partner, the hand and the pump count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public handshake(
    params: IAutoMovieMotionHumanHandshake.IParams,
    anchor?: string,
  ): this {
    return this.act("handshake", params, anchor);
  }

  /**
   * Meet a partner's hand at one shared point and instant.
   *
   * @param params The partner, the kind and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public highFive(
    params: IAutoMovieMotionHumanHighFive.IParams,
    anchor?: string,
  ): this {
    return this.act("highFive", params, anchor);
  }

  /**
   * Bring the lips to a partner's region by a lean and a neck flexion; the arms
   * stay free for a layer.
   *
   * @param params The partner, the region, the side and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kiss(
    params: IAutoMovieMotionHumanKiss.IParams,
    anchor?: string,
  ): this {
    return this.act("kiss", params, anchor);
  }

  /**
   * Reach for a prop's grip affordance, grasp it and lift it.
   *
   * @param params The prop, its grip, the hand and the lift.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public pickUp(
    params: IAutoMovieMotionHumanPickUp.IParams,
    anchor?: string,
  ): this {
    return this.act("pickUp", params, anchor);
  }

  /**
   * Set a held prop down at a place and let go.
   *
   * @param params The prop, where it goes and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public putDown(
    params: IAutoMovieMotionHumanPutDown.IParams,
    anchor?: string,
  ): this {
    return this.act("putDown", params, anchor);
  }

  /**
   * Hand a held prop to a receiver, letting go only after the receiver's grip
   * closes; `HumanChain.pair` appends both roles together.
   *
   * @param params The prop, the receiver, the grip and the hands.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public handOver(
    params: IAutoMovieMotionHumanHandoverAction.IParams,
    anchor?: string,
  ): this {
    return this.act("handOver", params, anchor);
  }

  /**
   * Take a prop a giver holds out; `HumanChain.pair` appends both roles
   * together.
   *
   * @param params The prop, the giver, the grip and the hands.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public receive(
    params: IAutoMovieMotionHumanReceive.IParams,
    anchor?: string,
  ): this {
    return this.act("receive", params, anchor);
  }

  /**
   * Throw a held object overarm, underarm or as a toss along a ballistic path
   * to a target.
   *
   * @param params The target, the style and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public throwObject(
    params: IAutoMovieMotionHumanThrowObjectParams,
    anchor?: string,
  ): this {
    return this.act("throwObject", params, anchor);
  }

  /**
   * Catch a thrown object where its path enters the reach, give with it and
   * hold it.
   *
   * @param params The throw answered, the hands and the object's radius.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public catchObject(
    params: IAutoMovieMotionHumanCatchObject.IParams,
    anchor?: string,
  ): this {
    return this.act("catchObject", params, anchor);
  }

  /**
   * Catch a real ball another performer's anchored action launched, at its
   * realized flight.
   *
   * @param params The launching anchor, the ball, the hands and the
   *   interception's seconds.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stageCatch(
    params: IAutoMovieMotionHumanCatchObject.IStageParams,
    anchor?: string,
  ): this {
    return this.act("stageCatch", params, anchor);
  }

  /**
   * Open a hand on what it holds: the prop leaves with the hand's velocity, or
   * a prop on a launcher leaves at the launcher's speed.
   *
   * @param params The hand, the prop and a launcher's launch.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public release(
    params: IAutoMovieMotionHumanRelease.IParams = {},
    anchor?: string,
  ): this {
    return this.act("release", params, anchor);
  }

  /**
   * Kick a ball beside the support foot with the instep.
   *
   * @param params The ball, the foot and where it is sent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kickBall(
    params: IAutoMovieMotionHumanKickBall.IParams,
    anchor?: string,
  ): this {
    return this.act("kickBall", params, anchor);
  }

  /**
   * Take an extinguisher by its carrying handle, pull its pin with the free
   * hand by its ring, then aim, squeeze and sweep (OSHA's PASS).
   *
   * @param params The extinguisher, the fire, the sweeps and the carrying hand.
   * @param anchor An optional anchor id, set on the sweep.
   * @returns The chain.
   */
  public pass(
    params: IAutoMovieMotionHumanFirefighting.IPass,
    anchor?: string,
  ): this {
    const { hand = "right", ...drill } = params;
    return this.pickUp({
      prop: params.prop,
      handle: "handle",
      hand,
      lift: 0.1,
    })
      .registered("workHeld", {
        prop: params.prop,
        hand: hand,
        drive: [{ articulation: "pin", to: PIN }],
        push: "ring",
        duration: 0.5,
      })
      .registered("extinguish", drill, anchor);
  }
}
