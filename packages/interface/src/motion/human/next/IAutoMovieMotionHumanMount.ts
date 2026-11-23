import type { IAutoMovieMotionHumanLeadHorse } from "../lexicon/IAutoMovieMotionHumanLeadHorse";
import type { IAutoMovieMotionHumanLunge } from "../lexicon/IAutoMovieMotionHumanLunge";
import type { IAutoMovieMotionHumanMounted } from "../lexicon/IAutoMovieMotionHumanMounted";
import type { IAutoMovieMotionHumanTendHorse } from "../lexicon/IAutoMovieMotionHumanTendHorse";
import type { IAutoMovieMotionHumanUnseat } from "../lexicon/IAutoMovieMotionHumanUnseat";
import type { IAutoMovieMotionHumanRide } from "./IAutoMovieMotionHumanRide";

/**
 * Living mounts: riding a horse, handling it from the ground and leaving its saddle. The horse prop owns the carrier's contacts and course, and every method here reads them at the film second it acts.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Mount family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Mount laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanMount<Chain> {
  /**
   * Riding a horse: a seated person carried by a support that moves by itself, such as a horse given to the performance as a moving prop (`HumanObject.prop` with a motion).
   *
   * @param params The `on`, `seconds`, `rising`, `feet`, `placeFeet`, `seat`, `hands` and `equestrian` of `IAutoMovieMotionHumanRide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  rideHorse(params: IAutoMovieMotionHumanRide.IParams, anchor?: string): Chain;

  /**
   * Leading a horse on foot: one hand takes the horse's moving lead rope, holds it while the handler walks, and lets it go, as an arm overlay over an authored walk.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanLeadHorse`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  leadHorse(params: IAutoMovieMotionHumanLeadHorse, anchor?: string): Chain;

  /**
   * Caring for a horse from the ground: one hand goes to a named place on the horse, holds there through a care task, and lets go, while the handler stands.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanTendHorse`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  tendHorse(params: IAutoMovieMotionHumanTendHorse, anchor?: string): Chain;

  /**
   * Lunging a horse from the ground: the handler stands at the circle's centre, turning on the spot to face the horse as it circles, with the lunge line in one hand and the whip in the other.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanLunge`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  lunge(params: IAutoMovieMotionHumanLunge, anchor?: string): Chain;

  /**
   * A rider leaving a moving saddle against their will: thrown, pulled down, dragged by a stirrup, stepping clear or slumped over the neck, released at an authored instant or on a hit.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanUnseat`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  unseat(params: IAutoMovieMotionHumanUnseat, anchor?: string): Chain;

  /**
   * A mounted performance on a moving carrier: an ordered list of seat figures, each planned in the frame of one of the carrier's own contacts and carried with it.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanMounted`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  mounted(params: IAutoMovieMotionHumanMounted, anchor?: string): Chain;
}
