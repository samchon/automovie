import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPerformance } from "../perform/IAutoMovieMotionHumanPerformance";
import type { IAutoMovieMotionHumanProp } from "../perform/IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "../perform/IAutoMovieMotionHumanPropFlight";

/**
 * Water polo: the credit of the direct, airborne portion of a shot. The same resolved flight that displays the ball supplies its radius, centre and the first contact or takeover that can end a scoring opportunity; the fixed goal's mouth faces the field with +Z and its +Y begins at the waterline. `scoreGoal` is a reader of the film, so it returns its named result and no chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the behaviour credits, its frame and its result.
 * @evidence contracts/development/design.md#principled-representation One reader over a placed performance's own flights and props.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The goal credit and nothing the performance owns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader takes the performance's own readers; nothing is redefined.
 */
export interface IAutoMovieMotionHumanWaterPolo {
  /**
   * Score the direct, airborne portion of a water polo shot: a goal is credited when the complete ball crosses the goal's aperture from the field side while its flight is the ball's own, before any capture, takeover or contact.
   *
   * @param params The `film`, the `ball` and the `goal`.
   * @returns Each credited goal, in film order.
   * @throws {HumanRefusal} When the goal is not a fixed, upright prop with a mouth aperture at the waterline.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the method does, its parameters and its return.
   */
  scoreGoal(
    params: IAutoMovieMotionHumanWaterPolo.IGoal,
  ): readonly IAutoMovieMotionHumanWaterPolo.ICue[];
}

/**
 * The parameter and result types of the water polo reader.
 */
export namespace IAutoMovieMotionHumanWaterPolo {
  /**
   * The parts of a performance the goal credit reads: its duration, its prop frames and its flights.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three members of the performance the reader reads.
   * @evidence contracts/development/design.md#principled-representation A pick of the performance's own members, so any performance reader fits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the credit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain pick, with no member added or widened.
   */
  export type IFilm = Pick<
    IAutoMovieMotionHumanPerformance,
    "duration" | "flights" | "prop"
  >;

  /**
   * The parameters of `scoreGoal`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what the reader takes.
   * @evidence contracts/development/design.md#principled-representation The film, the ball's subject id and the placed goal prop.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the goal credit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The goal is the scene's own prop, not a copy.
   */
  export interface IGoal {
    /** Performance displaying both the ball and the fixed goal. */
    film: IFilm;

    /** Subject id of the ball through catch, carry and shot. */
    ball: string;

    /** Fixed placed goal with the physical `mouth` aperture. */
    goal: IAutoMovieMotionHumanProp;
  }

  /**
   * Film-clock cue for a credited direct goal: the complete ball has gone through the goal's aperture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the original ball, opening, player, instant and measured centre.
   * @evidence contracts/development/design.md#principled-representation A cue records the physical event and its existing subjects.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the information needed to render or report the credited shot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A predictor or independent ball identity never enters a credited cue.
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
