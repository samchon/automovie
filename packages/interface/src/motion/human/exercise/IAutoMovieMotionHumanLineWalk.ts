import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A walk along a line too narrow for a normal gait (balance beam, tightrope):
 * the feet step heel to toe on the line, each turned out from it, the arms held
 * out to the sides, and the body sways over the line and corrects
 * (`lineWalk`).
 *
 * The line is a prop's: a beam's `surface` runs along its depth, a rope's or a
 * bar's `bar` along its length. A walk that would leave the line, or a line
 * narrower than the foot's grip on it, is refused.
 */
export namespace IAutoMovieMotionHumanLineWalk {
  /** The line walked on. */
  export interface IOn {
    /** Scene id of the beam, rope or bar. */
    prop: string;

    /**
     * Its affordance the line runs along: a `surface` along its depth or a
     * `bar` along its length; `surface` when absent.
     */
    affordance?: string;
  }

  /** Parameters. */
  export interface IParams {
    /** The line walked on. */
    on: IAutoMovieMotionHumanLineWalk.IOn;

    /** Where along the line the walk stops, world metres; projected on the line. */
    to: IAutoMovieVector3;

    /**
     * How many steps, a whole number of at least 1; the fewest heel-to-toe
     * steps that reach `to` when absent.
     */
    steps?: number;

    /**
     * A balancing pole held across the body in both hands at its `leftGrip` and
     * `rightGrip`, the pole resting there as the walk starts; the arms held out
     * when absent.
     */
    pole?: string;

    /**
     * How far a rope or wire sags at its middle under the walker, metres, at
     * least 0; the line's footprints follow the sag. Refused when the tension
     * it needs exceeds the line's working load. Straight when absent.
     */
    sag?: number;
  }
}
