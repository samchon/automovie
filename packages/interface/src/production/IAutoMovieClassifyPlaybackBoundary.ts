import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence";
import type { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

/**
 * The edit relation between two output instants of one cut, with each instant's
 * live shot clock.
 */
export namespace IAutoMovieClassifyPlaybackBoundary {
  /**
   * The cut, its prepared layout, the two output instants and the producer's
   * deliberate breaks.
   */
  export interface IProps {
    /** The cut the layout was built from, already admitted by `cutSequence`. */
    readonly sequence: IAutoMovieSequence;

    /** The layout of `sequence` from `sequenceTimeline`. */
    readonly timeline: IAutoMoviePlaybackTimeline;

    /** Earlier output second. */
    readonly before: number;

    /** Later output second, at or after `before`. */
    readonly after: number;

    /**
     * Deliberate breaks in authored takes. A break at shot-local `seconds`
     * separates every earlier instant of that shot from the instant itself and
     * every later one.
     */
    readonly discontinuities?: readonly {
      /** Id of the shot whose take breaks. */
      readonly shot: string;

      /** Shot-local second at which the new state begins. */
      readonly seconds: number;
    }[];
  }

  /** One instant on the live shot's clock. */
  export interface IEndpoint {
    /** Index of the live entry in `sequence.shots`. */
    readonly entry: number;

    /** Id of the live shot. */
    readonly shot: string;

    /** Shot-local seconds of the live shot at this instant. */
    readonly seconds: number;
  }

  /**
   * The relation and, when both instants lie on the timeline, their shot
   * clocks.
   *
   * `continuous` holds inside one entry and across a hard cut that resumes the
   * same shot exactly where the previous entry ended. `cut` holds across any
   * other edit, and whenever either instant shows a transition overlap.
   * `discontinuity` holds inside a continuous relation crossed by a declared
   * break. `unavailable` holds when an instant is not finite, the instants are
   * reversed, or either lies outside `[0, runtime)`.
   */
  export type IResult =
    | {
        readonly boundary: "continuous" | "cut" | "discontinuity";

        /** Live shot clock at `before`. */
        readonly before: IEndpoint;

        /** Live shot clock at `after`. */
        readonly after: IEndpoint;
      }
    | { readonly boundary: "unavailable" };
}
