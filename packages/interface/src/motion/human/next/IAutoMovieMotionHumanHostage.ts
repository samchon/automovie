import type { IAutoMovieMotionHumanDisarm } from "../grappling/IAutoMovieMotionHumanDisarm";
import type { IAutoMovieMotionHumanHostageHold } from "../grappling/IAutoMovieMotionHumanHostageHold";

/**
 * A hostage scene: a hostage held by an arm and a disarm of a knife or a
 * handgun. The hold and the disarm are authored scenes with no source
 * (provisional).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanHostage` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanHostage<Chain> {
  /**
   * A staged disarm: the defender takes a knife or a handgun from a resisting
   * partner, and the partner's hand gives it up.
   *
   * Registered law: `registered("disarm", params)`; not a chain method.
   *
   * @param params The `partner`, `prop`, `kind`, `hand` and `lever` of
   *   `IAutoMovieMotionHumanDisarm.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  disarm(params: IAutoMovieMotionHumanDisarm.IParams, anchor?: string): Chain;

  /**
   * A hostage hold from behind: the holder's free arm lies across the hostage's
   * chest or neck, the other hand presents a held weapon at the hostage's head
   * or throat, and the pair walks backward together.
   *
   * Registered law: `registered("hostageHold", params)`; not a chain method.
   *
   * @param params The `partner`, `arm`, `prop`, `point`, `region`, `back` and
   *   `duration` of `IAutoMovieMotionHumanHostageHold.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  hostageHold(
    params: IAutoMovieMotionHumanHostageHold.IParams,
    anchor?: string,
  ): Chain;

  /**
   * The hostage of a hold: the body keeps the posture it entered with and walks
   * backward with the holder, its root following the holder's displayed root
   * and its feet stepping the same displacement, so the pair keeps its order.
   * The holder is composed before the hostage, so its root is placed to be
   * read.
   *
   * Registered law: `registered("heldHostage", params)`; not a chain method.
   *
   * @param params The `partner` of `IAutoMovieMotionHumanHostageHold.IHeld`,
   *   the holder.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  heldHostage(
    params: IAutoMovieMotionHumanHostageHold.IHeld,
    anchor?: string,
  ): Chain;

  /**
   * The armed partner of a disarm: the hand that gives the weapon up opens at
   * the instant the defender's disarm takes it, following the defender's
   * lever.
   *
   * Registered law: `registered("disarmed", params)`; not a chain method.
   *
   * @param params The `partner` and `of` of
   *   `IAutoMovieMotionHumanDisarm.IYield`, the defender and the anchor of its
   *   disarm.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  disarmed(params: IAutoMovieMotionHumanDisarm.IYield, anchor?: string): Chain;
}
