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
 * Gymnastic and tumbling skills in flight: the salto, cartwheel, round-off, handspring, trampoline and skydive, and the trick and Roman riding of a performer on horses that move.
 *
 * `AutoMovieMotionHumanAcrobatics.ROUND_OFF_LEFT` and `ROUND_OFF_RIGHT` (`IRoundOffPreset`) are the round-off led with one hand, data spread into `roundOff`'s parameters; a preset adds no method.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Acrobatics family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Acrobatics laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanAcrobatics<Chain> {
  /**
   * A handstand kicked up from standing, held and stepped down (#3251).
   *
   * @param params The `seconds` and `manner` of `IAutoMovieMotionHumanGymnastics.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  gymnastics(
    params: IAutoMovieMotionHumanGymnastics.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A salto: a jump whose flight turns the whole body head over heels about its centre of mass, forward or backward, a whole number of times, and lands on the feet (#3377: the salti of floor gymnastics, a diver's and a free-runner's flip).
   *
   * @param params The `to`, `apex`, `way` and `turns` of `IAutoMovieMotionHumanSalto.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  salto(params: IAutoMovieMotionHumanSalto.IParams, anchor?: string): Chain;

  /**
   * A cartwheel (#3377): the body turns once about its front-to-back axis, sideways, passing from one foot to one hand, the other hand, and the other foot, and stands again a wheel's roll to the side.
   *
   * @param params The `to` and `seconds` of `IAutoMovieMotionHumanCartwheel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  cartwheel(
    params: IAutoMovieMotionHumanCartwheel.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A round-off (#3377): a cartwheel that travels along the way the body faced, turns half round about the vertical and lands on both feet at once, facing back where it came from, the entry to a back handspring or a back salto.
   *
   * @param params The `lead` and `seconds` of `IAutoMovieMotionHumanRoundOff.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  roundOff(
    params: IAutoMovieMotionHumanRoundOff.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A front handspring (#3377): from standing, the body reaches forward into a lunge, turns head over heels in pitch over its hands, leaves them and flies to its feet, landing arched and rising to stand.
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
   * Bouncing on a trampoline (#4006): straight bounces that build toward an apex, a shape held at each flight's apex, and a kill that absorbs the last landing to a stop.
   *
   * @param params The `on`, `bounces`, `apex` and `shape` of `IAutoMovieMotionHumanTrampoline.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  trampoline(
    params: IAutoMovieMotionHumanTrampoline.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A parachute jump from a named edge: the exit, the belly-to-earth freefall in the arch with an optional track and turn, the deployment at an authored altitude, the canopy flight steered by the toggles with a flare before the ground, and the landing in a parachute landing fall or on the feet.
   *
   * @param params The `from`, `edge`, `deploy`, `track`, `turn`, `toggles` and `landing` of `IAutoMovieMotionHumanSkydive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  skydive(params: IAutoMovieMotionHumanSkydive.IParams, anchor?: string): Chain;

  /**
   * Trick riding on a moving horse's trick saddle (#3950): from the seat, each figure in turn is reached over its transfer and held; the act ends back in the seat.
   *
   * @param params The `on`, `frame` and `figures` of `IAutoMovieMotionHumanTrick`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  trick(params: IAutoMovieMotionHumanTrick, anchor?: string): Chain;

  /**
   * Roman riding (#3950): standing with one foot on each of two horses that move together side by side, held for a time.
   *
   * @param params The `left`, `right`, `frame`, `hold` and `step` of `IAutoMovieMotionHumanRoman`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  roman(params: IAutoMovieMotionHumanRoman, anchor?: string): Chain;
}

/**
 * The parameter types of the Acrobatics methods.
 */
export namespace IAutoMovieMotionHumanAcrobatics {
  /**
   * The values a round-off led with one hand fixes: the hand that goes down first. It is spread into `roundOff`'s parameters, which keep the duration open.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the one value the preset fixes and how it is applied.
   * @evidence contracts/development/design.md#principled-representation `lead` is an `AutoMovieHumanSide`, the person's own side, as the round-off reads it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the fixed key of the rows `roundOffLeft` and `roundOffRight`; the law's other parameters stay open.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the preset carries no value the law does not read.
   */
  export interface IRoundOffPreset {
    /** The hand that goes down first, the person's own left or right. */
    lead: AutoMovieHumanSide;
  }
}
