import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPerformance } from "./IAutoMovieMotionHumanPerformance";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";

/**
 * Inputs and film-clock cues for scoring direct water polo goals.
 */
export namespace IAutoMovieMotionHumanWaterPolo {
  /**
   * Placed film data for scoring: duration, goal frames and ball flights.
   *
   * The film and all its flights use the same clock in seconds.
   */
  export type IFilm = Pick<
    IAutoMovieMotionHumanPerformance,
    "duration" | "flights" | "prop"
  >;

  /**
   * One ball and one fixed goal read from the same play.
   */
  export interface IGoal {
    /**
     * Placed film supplying the goal frame and realized ball flights.
     */
    film: IFilm;

    /**
     * Existing scene ID of the ball across possession and flight.
     */
    ball: string;

    /**
     * Fixed goal exposing a positive, level `mouth` aperture at the waterline.
     *
     * The mouth's local `+Z` faces the field.
     */
    goal: IAutoMovieMotionHumanProp;
  }

  /**
   * Credit for one direct crossing of the complete ball through the mouth.
   */
  export interface ICue {
    /**
     * Discriminator for a credited goal.
     */
    kind: "goal";

    /** The ball's existing performance subject id. */
    ball: string;

    /** The chosen goal's existing performance subject id. */
    goal: string;

    /**
     * Performer who launched the scoring flight.
     */
    scorer: IAutoMovieMotionHumanPropFlight.IFlight["source"]["subject"];

    /**
     * Film second when the complete sphere clears the mouth plane.
     */
    seconds: number;

    /**
     * Physical ball centre at the scoring instant, in world metres.
     */
    center: IAutoMovieVector3;
  }
}
