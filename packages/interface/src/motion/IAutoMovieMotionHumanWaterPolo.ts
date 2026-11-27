import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPerformance } from "./IAutoMovieMotionHumanPerformance";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";

/**
 * Water polo: the credit of the direct, airborne portion of a shot. The same
 * resolved flight that displays the ball supplies its radius, centre and the
 * first contact or takeover that can end a scoring opportunity; the fixed
 * goal's mouth faces the field with +Z and its +Y begins at the waterline.
 * `scoreGoal` is a reader of the film, so it returns its named result and no
 * chain.
 */


/** The parameter and result types of the water polo reader. */
export namespace IAutoMovieMotionHumanWaterPolo {
  /**
   * The parts of a performance the goal credit reads: its duration, its prop
   * frames and its flights.
   */
  export type IFilm = Pick<
    IAutoMovieMotionHumanPerformance,
    "duration" | "flights" | "prop"
  >;

  /** The parameters of `scoreGoal`. */
  export interface IGoal {
    /** Performance displaying both the ball and the fixed goal. */
    film: IFilm;

    /** Subject id of the ball through catch, carry and shot. */
    ball: string;

    /** Fixed placed goal with the physical `mouth` aperture. */
    goal: IAutoMovieMotionHumanProp;
  }

  /**
   * Film-clock cue for a credited direct goal: the complete ball has gone
   * through the goal's aperture.
   */
  export interface ICue {
    /** Cue discriminator. */
    kind: "goal";

    /** The ball's existing performance subject id. */
    ball: string;

    /** The chosen goal's existing performance subject id. */
    goal: string;

    /** The performer responsible for the observed launch. */
    scorer: IAutoMovieMotionHumanPropFlight.IFlight["source"]["subject"];

    /** The scoring instant in film seconds. */
    seconds: number;

    /** The physical ball centre at the scoring instant, world metres. */
    center: IAutoMovieVector3;
  }
}
