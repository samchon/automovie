import type { IAutoMovieMotionHumanBowlingSlide } from "../sport/IAutoMovieMotionHumanBowlingSlide";
import type { IAutoMovieMotionHumanPrecisionDeck } from "../sport/IAutoMovieMotionHumanPrecisionDeck";

/**
 * Ten-pin bowling: the final slide of the approach and the credit of the pins a baked delivery knocks down. The delivery itself is the throw with the bowling style (`AutoMovieMotionHumanBowling.DELIVERY`, a preset of `IAutoMovieMotionHumanThrowCatch.IStylePreset`), so the behaviour adds no throw method. `slide` appends an action and returns the chain; `readPinfall` is a reader, so it returns its named result and not the chain.
 *
 * @template Chain The chain the slide returns; the chain implements this interface.
 */
export interface IAutoMovieMotionHumanBowling<Chain> {
  /**
   * The final glide of a one-handed ten-pin approach: the foot opposite the delivery hand slides forward under load, brakes, and the trailing foot steps up to a recovery plant.
   *
   * @param params The `distance`, `from`, `to`, `seconds` and `hand` of `IAutoMovieMotionHumanBowlingSlide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  slide(
    params: IAutoMovieMotionHumanBowlingSlide.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Credit the pinfall of a baked bowling delivery: the pins down at the end of its cache, in rack order. A pin is down when its axis leans past its tip-over angle, where its centre of mass passes over the rim of its base (USBC counts a pin knocked down or off the deck).
   *
   * @param params The `pins` and the baked `result`.
   * @returns The ids of the pins down at the cache end.
   * @throws {RangeError} When a pin has no hull base below its centre of mass, or is missing from the cache.
   */
  readPinfall(
    params: IAutoMovieMotionHumanBowling.IReadPinfall,
  ): IAutoMovieMotionHumanBowling.IPinfall;
}

/**
 * The parameter and result types of the bowling methods.
 */
export namespace IAutoMovieMotionHumanBowling {
  /**
   * The parameters of `readPinfall`.
   */
  export interface IReadPinfall {
    /** The placed pins, each upright on its base with +Y along its axis. */
    pins: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

    /** The baked deck whose cache holds the pins. */
    result: IAutoMovieMotionHumanPrecisionDeck.IResult;
  }

  /**
   * The ids of the pins down at the cache end, in rack order.
   */
  export type IPinfall = string[];
}
