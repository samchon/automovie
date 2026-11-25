import type { IAutoMovieChain } from "../../composition/IAutoMovieChain";
import type { IAutoMovieComposition } from "../../composition/IAutoMovieComposition";
import type { IAutoMovieIntent } from "../../composition/IAutoMovieIntent";
import type { AutoMovieMotionHumanActionName } from "../AutoMovieMotionHumanActionName";
import type { IAutoMovieMotionHumanActionParams } from "../IAutoMovieMotionHumanActionParams";
import type { IAutoMovieMotionHumanHitTrack } from "../perform/IAutoMovieMotionHumanHitTrack";
import type { IAutoMovieMotionHumanResponse } from "../skill/IAutoMovieMotionHumanResponse";

/**
 * The part of a person's chain that knows no action: whose chain it is, how an
 * action is appended by name with that action's own parameter type, and how the
 * last action is cut.
 *
 * `HumanChain` is this class with one vocabulary method per action, added by
 * the family classes between them. Each of those methods is `act` under the
 * action's name, so `chain.touch(params)` and `chain.act("touch", params)`
 * append the same intent and are checked against the same parameter type.
 */
export interface IAutoMovieMotionHumanChainCore extends IAutoMovieChain {
  /** The person whose actions this chain appends. */
  readonly subject: string;

  /**
   * Append an action by name. The parameters are the named action's own, so a
   * misspelt name, a parameter the action does not take and a wrong value are
   * refused by the type checker; an action whose parameters are all optional
   * may be appended without any.
   *
   * @param name The action.
   * @param args Its parameters, then an optional anchor: a stable id another
   *   chain can align to or cut on.
   * @returns The chain.
   */
  act<Name extends AutoMovieMotionHumanActionName>(
    name: Name,
    ...args: IAutoMovieMotionHumanChainCore.Arguments<Name>
  ): this;

  /**
   * Append an action a production registered with the performance
   * (`IAutoMovieMotionHumanPerformance.IInput.laws`), by the name its law
   * carries. The parameters are the registered law's own and are not checked
   * here; `HumanChain.extend` gives the same action a typed method, which is
   * the way to call it from code that knows the law.
   *
   * @param name The registered law's name.
   * @param params Its parameters.
   * @param anchor A stable id another chain can align to or cut on.
   * @returns The chain.
   */
  registered(name: string, params?: object, anchor?: string): this;

  /**
   * Cut the last appended action: at a share, at one of its events, at another
   * action's event, or when a region comes near a target.
   *
   * @param until The cut.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced
   *   (cut it before syncing it).
   */
  until(until: NonNullable<IAutoMovieIntent["until"]>): this;

  /**
   * Time the last appended action to an instant of another action or of a cue
   * track, as BML's synchronisation constraints do: one of its own instants
   * (`align`, its start when absent) falls on the instant named (`of` and
   * `event`), `offset` seconds later.
   *
   * The action starts as early as that needs. Where its performer's previous
   * action still runs then, that action is cut there, which its cancel table
   * must allow; an action that would have to start before its performer's
   * previous one, or before the film, is refused with the earliest instant it
   * can meet. What follows in the chain starts when the synced action ends.
   * `schedule.entries[i].end` is an action's uncut end; `segments()` holds the
   * cut one that plays. Cut the action (`until`) and put overlays on it
   * (`over`) before syncing it.
   *
   * ```ts
   * a.stand().gesture({ kind: "beat" }).sync({
   *   of: "dialogue",
   *   event: "accent",
   *   index: 2,
   *   align: "strokeEnd",
   * });
   * b.stand().flinch().sync({ of: "strike" });
   * ```
   *
   * @param sync The instant to meet and which instant of the action meets it.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced
   *   (an action meets one instant).
   */
  sync(sync: IAutoMovieMotionHumanChainCore.ISync): this;

  /**
   * Perform other actions over the last appended one, at the same time and on
   * other parts of the body: a wave or a phone during a walk.
   *
   * The last action carries the body (its root, its legs and whatever it does
   * not yield); the actions `build` appends to the empty chain it is given
   * start with it, follow one another, and each takes only the channels it
   * claims. The performance refuses an action that cannot ride a carrier, a
   * carrier that does not yield the channels asked, and two overlays that claim
   * one channel at one time, naming both claims.
   *
   * ```ts
   * a.walk({ to }).over((u) => u.handToFace({ kind: "phone" }));
   * ```
   *
   * @param build Appends the overlaid actions to an empty chain of this person.
   * @returns The chain.
   * @throws {Error} When the chain ends in no action, or in one already synced
   *   (put the overlays on it before syncing it).
   */
  over(build: (overlay: this) => IAutoMovieMotionHumanChainCore): this;
}

/**
 * The part of a person's chain that knows no action: whose chain it is, how an
 * action is appended by name with that action's own parameter type, and how the
 * last action is cut.
 *
 * `HumanChain` is this class with one vocabulary method per action, added by
 * the family classes between them. Each of those methods is `act` under the
 * action's name, so `chain.touch(params)` and `chain.act("touch", params)`
 * append the same intent and are checked against the same parameter type.
 */
export namespace IAutoMovieMotionHumanChainCore {
  /** The callable constructor and static factories. */
  export interface IConstructor {
    /**
     * A chain of a person's actions.
     *
     * @param subject The person.
     * @param node The composition.
     */
    new (
      subject: string,
      node: IAutoMovieComposition,
    ): IAutoMovieMotionHumanChainCore;
  }

  /**
   * What follows the name in `act`: the action's parameters and an optional
   * anchor. The parameters may be left out only when every one of them is
   * optional.
   */
  export type Arguments<Name extends AutoMovieMotionHumanActionName> =
    {} extends IAutoMovieMotionHumanActionParams[Name]
      ? [params?: IAutoMovieMotionHumanActionParams[Name], anchor?: string]
      : [params: IAutoMovieMotionHumanActionParams[Name], anchor?: string];

  /** An instant to meet, and which instant of the synced action meets it. */
  export interface ISync {
    /**
     * The anchor of an action placed earlier in the composition, or the name of
     * a cue track; given unless `hit` is.
     */
    of?: string;

    /**
     * A hit instead of a named instant: the `index`-th hit on the struck
     * subject `on` (from 0), by the striking prop or anchored striker `by` when
     * given. Its strikers are composed before the struck performer, so the hit
     * is known when this action is placed (`HumanHitTrack`). A reaction synced
     * to a hit on its own performer goes in a chain of its own, composed after
     * the strikers' chains: inside the performer's main chain the hit track is
     * empty. Two people who strike and answer each other are composed as
     * alternating time-ordered chains, each segment's first action synced to an
     * anchor of the other and its last a hold the next sync cuts.
     */
    hit?: IAutoMovieMotionHumanHitTrack.IHit;

    /**
     * Which instant of it: one of its events, or `start` or `end`. Absent, an
     * action's decisive instant (a strike's `impact`, a defence's `contact`) or
     * else its start; a cue track always needs one. A punch has `launch`,
     * `impact` and `recovered` (`shown` instead of `impact` when it feints); a
     * kick `launch`, `chamber`, `impact` and `replant`; a defence `read`,
     * `set`, `contact` and `recovered`.
     */
    event?: string;

    /**
     * Which occurrence of that event, from 0, where it repeats, as a track's
     * beats do; 0 when absent.
     */
    index?: number;

    /**
     * The synced action's own instant that falls there: one of its events; its
     * start when absent.
     */
    align?: string;

    /** Seconds after the instant named; negative is before. 0 when absent. */
    offset?: number;

    /**
     * A delay drawn per performer and added after `offset`: `reaction` for a
     * person answering the cue (a command, a shot), shortened by the
     * preparatory word when the track names one (`HumanCue.orders`), or a
     * stated normal for a deliberate pause (`HumanResponse.latency`). Keyed by
     * the performer, the synced action's id and `latency`, so it is the
     * performer's own and no other draw moves. None when absent.
     */
    latency?: IAutoMovieMotionHumanResponse.Latency;
  }
}
