import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Sitting volleyball, a rally played from the floor.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanSittingVolley` or from the row namespace of the family,
 * and append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


export namespace IAutoMovieMotionHumanSittingVolley {
  /**
   * One seated floor shift and forearm receive for sitting volleyball, entered
   * from an established floor seat with the athlete facing the incoming play.
   */
  export interface ISittingVolley {
    /**
     * Seconds for the floor shift and receive; the palm plants at 0.25 of it,
     * releases at 0.55 and the receive lands at 0.8 (`HumanSittingVolley`
     * shares, provisional). No natural value is defined: choose it for the beat
     * (provisional, missing).
     */
    duration: number;

    /** Signed floor displacement in metres toward the left of entry heading. */
    lateral: number;

    /** Floor palm used to assist the shift. */
    hand: AutoMovieHumanSide;

    /** World location of the intended forearm-platform midpoint, in metres. */
    target: IAutoMovieVector3;
  }
}
