import type { kickBall } from "../ballStrike/kickBall";
import type { handOver } from "../handling/handOver";
import type { handshake } from "../handling/handshake";
import type { pickUp } from "../handling/pickUp";
import type { putDown } from "../handling/putDown";
import type { receive } from "../handling/receive";
import type { catchObject } from "../throwing/catchObject";
import type { throwObject } from "../throwing/throwObject";
import type { highFive } from "../touch/highFive";
import type { kiss } from "../touch/kiss";
import { HumanChainStriking } from "./HumanChainStriking";

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
export class HumanChainMutual extends HumanChainStriking {
  /**
   * Shake hands with a partner standing within reach; `HumanChain.pair`
   * appends both partners' handshakes together.
   *
   * @param params The partner, the hand and the pump count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public handshake(params: handshake.IParams, anchor?: string): this {
    return this.act("handshake", params, anchor);
  }

  /**
   * Meet a partner's hand at one shared point and instant.
   *
   * @param params The partner, the kind and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public highFive(params: highFive.IParams, anchor?: string): this {
    return this.act("highFive", params, anchor);
  }

  /**
   * Bring the lips to a partner's region by a lean and a neck flexion; the
   * arms stay free for a layer.
   *
   * @param params The partner, the region, the side and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kiss(params: kiss.IParams, anchor?: string): this {
    return this.act("kiss", params, anchor);
  }

  /**
   * Reach for a prop's grip affordance, grasp it and lift it.
   *
   * @param params The prop, its grip, the hand and the lift.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public pickUp(params: pickUp.IParams, anchor?: string): this {
    return this.act("pickUp", params, anchor);
  }

  /**
   * Set a held prop down at a place and let go.
   *
   * @param params The prop, where it goes and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public putDown(params: putDown.IParams, anchor?: string): this {
    return this.act("putDown", params, anchor);
  }

  /**
   * Hand a held prop to a receiver, letting go only after the receiver's
   * grip closes; `HumanChain.pair` appends both roles together.
   *
   * @param params The prop, the receiver, the grip and the hands.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public handOver(params: handOver.IParams, anchor?: string): this {
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
  public receive(params: receive.IParams, anchor?: string): this {
    return this.act("receive", params, anchor);
  }

  /**
   * Throw a held object overarm, underarm or as a toss along a ballistic
   * path to a target.
   *
   * @param params The target, the style and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public throwObject(params: throwObject.IParams, anchor?: string): this {
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
  public catchObject(params: catchObject.IParams, anchor?: string): this {
    return this.act("catchObject", params, anchor);
  }

  /**
   * Kick a ball beside the support foot with the instep.
   *
   * @param params The ball, the foot and where it is sent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public kickBall(params: kickBall.IParams, anchor?: string): this {
    return this.act("kickBall", params, anchor);
  }
}
