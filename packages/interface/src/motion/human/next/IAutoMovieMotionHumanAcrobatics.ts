import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanTrampoline } from "../exercise/IAutoMovieMotionHumanTrampoline";
import type { IAutoMovieMotionHumanRoman } from "../lexicon/IAutoMovieMotionHumanRoman";
import type { IAutoMovieMotionHumanSkydive } from "../lexicon/IAutoMovieMotionHumanSkydive";
import type { IAutoMovieMotionHumanTrick } from "../lexicon/IAutoMovieMotionHumanTrick";
import type { IAutoMovieMotionHumanCartwheel } from "../sport/IAutoMovieMotionHumanCartwheel";
import type { IAutoMovieMotionHumanGymnastics } from "../sport/IAutoMovieMotionHumanGymnastics";
import type { IAutoMovieMotionHumanHandspring } from "../sport/IAutoMovieMotionHumanHandspring";
import type { IAutoMovieMotionHumanRoundOff } from "../sport/IAutoMovieMotionHumanRoundOff";
import type { IAutoMovieMotionHumanSalto } from "../sport/IAutoMovieMotionHumanSalto";

/**
 * Gymnastic and tumbling skills in flight: the salto, cartwheel, round-off,
 * handspring, trampoline and skydive, and the trick and Roman riding of a
 * performer on horses that move.
 *
 * `AutoMovieMotionHumanAcrobatics.ROUND_OFF_LEFT` and `ROUND_OFF_RIGHT`
 * (`IRoundOffPreset`) are the round-off led with one hand, data spread into
 * `roundOff`'s parameters; a preset adds no method.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanAcrobatics` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanAcrobatics<Chain> {
  /**
   * A handstand kicked up from standing, held and stepped down.
   *
   * @param params The `hold` and `manner` of
   *   `IAutoMovieMotionHumanGymnastics.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  gymnastics(
    params: IAutoMovieMotionHumanGymnastics.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A salto: a jump whose flight turns the whole body head over heels about its
   * centre of mass, forward or backward, a whole number of times, and lands on
   * the feet (the salti of floor gymnastics, a diver's and a free-runner's
   * flip).
   *
   * Registered law: `registered("salto", params)`; not a chain method.
   *
   * @param params The `to`, `apex`, `way` and `turns` of
   *   `IAutoMovieMotionHumanSalto.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  salto(params: IAutoMovieMotionHumanSalto.IParams, anchor?: string): Chain;

  /**
   * A cartwheel: the body turns once about its front-to-back axis, sideways,
   * passing from one foot to one hand, the other hand, and the other foot, and
   * stands again a wheel's roll to the side.
   *
   * Registered law: `registered("cartwheel", params)`; not a chain method.
   *
   * @param params The `to` and `duration` of
   *   `IAutoMovieMotionHumanCartwheel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  cartwheel(
    params: IAutoMovieMotionHumanCartwheel.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A round-off: a cartwheel that travels along the way the body faced, turns
   * half round about the vertical and lands on both feet at once, facing back
   * where it came from, the entry to a back handspring or a back salto.
   *
   * Registered law: `registered("roundOff", params)`; not a chain method.
   *
   * @param params The `lead` and `duration` of
   *   `IAutoMovieMotionHumanRoundOff.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  roundOff(
    params: IAutoMovieMotionHumanRoundOff.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A front handspring: from standing, the body reaches forward into a lunge,
   * turns head over heels in pitch over its hands, leaves them and flies to its
   * feet, landing arched and rising to stand.
   *
   * Registered law: `registered("handspring", params)`; not a chain method.
   *
   * @param params The `lead` of `IAutoMovieMotionHumanHandspring.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  handspring(
    params: IAutoMovieMotionHumanHandspring.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Bouncing on a trampoline: straight bounces that build toward an apex, a
   * shape held at each flight's apex, and a kill that absorbs the last landing
   * to a stop.
   *
   * Registered law: `registered("trampoline", params)`; not a chain method.
   *
   * @param params The `on`, `bounces`, `apex` and `shape` of
   *   `IAutoMovieMotionHumanTrampoline.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  trampoline(
    params: IAutoMovieMotionHumanTrampoline.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A parachute jump from a named edge: the exit, the belly-to-earth freefall
   * in the arch with an optional track and turn, the deployment at an authored
   * altitude, the canopy flight steered by the toggles with a flare before the
   * ground, and the landing in a parachute landing fall or on the feet.
   *
   * Registered law: `registered("skydive", params)`; not a chain method.
   *
   * @param params The `from`, `edge`, `deploy`, `track`, `turn`, `toggles` and
   *   `landing` of `IAutoMovieMotionHumanSkydive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  skydive(params: IAutoMovieMotionHumanSkydive.IParams, anchor?: string): Chain;

  /**
   * Trick riding on a moving horse's trick saddle: from the seat, each figure
   * in turn is reached over its transfer and held; the act ends back in the
   * seat.
   *
   * Registered law: `registered("trick", params)`; not a chain method.
   *
   * @param params The `on`, `frame` and `figures` of
   *   `IAutoMovieMotionHumanTrick`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  trick(params: IAutoMovieMotionHumanTrick, anchor?: string): Chain;

  /**
   * Roman riding: standing with one foot on each of two horses that move
   * together side by side, held for a time.
   *
   * Registered law: `registered("roman", params)`; not a chain method.
   *
   * @param params The `left`, `right`, `frame`, `hold` and `step` of
   *   `IAutoMovieMotionHumanRoman`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  roman(params: IAutoMovieMotionHumanRoman, anchor?: string): Chain;
}

/** The parameter types of the Acrobatics methods. */
export namespace IAutoMovieMotionHumanAcrobatics {
  /**
   * The values a round-off led with one hand fixes: the hand that goes down
   * first. It is spread into `roundOff`'s parameters, which keep the duration
   * open.
   */
  export interface IRoundOffPreset {
    /** The hand that goes down first, the person's own left or right. */
    lead: AutoMovieHumanSide;
  }
}
