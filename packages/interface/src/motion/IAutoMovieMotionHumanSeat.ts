
import type { IAutoMovieMotionHumanKneel } from "./IAutoMovieMotionHumanKneel";

/**
 * The seated postures and their transitions: sitting down, rising and kneeling.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanSeat` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/** The parameter types of the Seat methods. */
export namespace IAutoMovieMotionHumanSeat {
  /**
   * The kind, hold and rise that a named kneel fixes: the `kind`, `hold` and
   * `rise` of `kneel`. Spread into `kneel`'s parameters;
   * `AutoMovieMotionHumanSeat.TAKE_A_KNEE`, `KNEEL_BRIEFLY` and `KNEEL_SIT` are
   * its data and the rows of the same names read them.
   */
  export type IKneelPreset = Pick<
    IAutoMovieMotionHumanKneel.IParams,
    "kind" | "hold" | "rise"
  >;
}
