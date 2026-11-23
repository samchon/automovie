import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A staged collapse: the body goes down to the floor in a chosen direction and
 * tone, for a faint or a fatal hit.
 *
 * `backward` is the knockdown (`IAutoMovieMotionHumanKnockdown`): the seat
 * lands behind the feet and the back rolls down. `forward` drops onto the knees
 * and pitches onto the chest. `sideways` drops onto the knees and topples onto
 * one hip and shoulder. `inPlace` folds the knees, hips and trunk straight down
 * into a heap over the feet. A `limp` body keeps its arms at its sides and the
 * head follows the trunk, as a faint or a fatal hit leaves it (Robinovitch et
 * al. 2013, Lancet 381:47, class collapse apart from trips and hits); a
 * `protective` body reaches the floor with its hands before its trunk. An
 * optional sag first softens the knees and sways the trunk, as a faint shows
 * before the drop (Smeesters, Hayes and McMahon 2001, J Biomech 34:309,
 * simulated faints). Each pose rests on the floor by the knockdown's floor
 * rest, so nothing penetrates it.
 */
export namespace IAutoMovieMotionHumanCollapse {
  /** Where the body goes down. */
  export type Direction = "backward" | "forward" | "sideways" | "inPlace";

  /** How the body meets the floor. */
  export type Tone = "limp" | "protective";

  /** Parameters. */
  export interface IParams {
    /** Where the body goes down; `forward` when absent. */
    direction?: Direction;

    /** How the body meets the floor; `limp` when absent. */
    tone?: Tone;

    /**
     * A sideways fall's side; the side away from the blow, or the left, when
     * absent.
     */
    side?: "left" | "right";

    /** Where the blow came from; a place ahead of the performer when absent. */
    target?: IAutoMovieMotionTarget;

    /**
     * How long the knees give and the trunk sways before the drop, seconds; 0
     * when absent, the drop starting at once. A faint is shown with a sag
     * (Smeesters, Hayes and McMahon 2001); no study gives its duration, so the
     * value is the author's.
     */
    sag?: number;

    /**
     * How long the body lies after landing, seconds; 1 when absent; see
     * {@link IAutoMovieMotionHumanKnockdown.IParams.seconds}.
     */
    hold?: number;
  }
}
