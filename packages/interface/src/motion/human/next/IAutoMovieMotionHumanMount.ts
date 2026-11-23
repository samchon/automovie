import type { IAutoMovieMotionHumanLeadHorse } from "../lexicon/IAutoMovieMotionHumanLeadHorse";
import type { IAutoMovieMotionHumanLunge } from "../lexicon/IAutoMovieMotionHumanLunge";
import type { IAutoMovieMotionHumanMounted } from "../lexicon/IAutoMovieMotionHumanMounted";
import type { IAutoMovieMotionHumanTendHorse } from "../lexicon/IAutoMovieMotionHumanTendHorse";
import type { IAutoMovieMotionHumanUnseat } from "../lexicon/IAutoMovieMotionHumanUnseat";
import type { IAutoMovieMotionHumanRide } from "./IAutoMovieMotionHumanRide";

/**
 * Living mounts: riding a horse, handling it from the ground and leaving its
 * saddle. The horse prop owns the carrier's contacts and course, and every
 * method here reads them at the film second it acts.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanMount` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanMount<Chain> {
  /**
   * Riding a horse: a seated person carried by a support that moves by itself,
   * such as a horse given to the performance as a moving prop
   * (`HumanObject.prop` with a motion).
   *
   * Registered law: `registered("rideHorse", params)`; not a chain method.
   *
   * @param params The `on`, `duration`, `rising`, `feet`, `placeFeet`, `seat`,
   *   `hands` and `equestrian` of `IAutoMovieMotionHumanRide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  rideHorse(params: IAutoMovieMotionHumanRide.IParams, anchor?: string): Chain;

  /**
   * Leading a horse on foot: one hand takes the horse's moving lead rope, holds
   * it while the handler walks, and lets it go, as an arm overlay over an
   * authored walk.
   *
   * Registered law: `registered("leadHorse", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the named arm and its hand.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanLeadHorse`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  leadHorse(params: IAutoMovieMotionHumanLeadHorse, anchor?: string): Chain;

  /**
   * Caring for a horse from the ground: one hand goes to a named place on the
   * horse, holds there through a care task, and lets go, while the handler
   * stands.
   *
   * Registered law: `registered("tendHorse", params)`; not a chain method.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanTendHorse`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  tendHorse(params: IAutoMovieMotionHumanTendHorse, anchor?: string): Chain;

  /**
   * Lunging a horse from the ground: the handler stands at the circle's centre,
   * turning on the spot to face the horse as it circles, with the lunge line in
   * one hand and the whip in the other.
   *
   * Registered law: `registered("lunge", params)`; not a chain method.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanLunge`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lunge(params: IAutoMovieMotionHumanLunge, anchor?: string): Chain;

  /**
   * A rider leaving a moving saddle against their will: thrown, pulled down,
   * dragged by a stirrup, stepping clear or slumped over the neck, released at
   * an authored instant or on a hit.
   *
   * Registered law: `registered("unseat", params)`; not a chain method.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanUnseat`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  unseat(params: IAutoMovieMotionHumanUnseat, anchor?: string): Chain;

  /**
   * A mounted performance on a moving carrier: an ordered list of seat figures,
   * each planned in the frame of one of the carrier's own contacts and carried
   * with it.
   *
   * Registered law: `registered("mounted", params)`; not a chain method.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanMounted`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  mounted(params: IAutoMovieMotionHumanMounted, anchor?: string): Chain;
}
