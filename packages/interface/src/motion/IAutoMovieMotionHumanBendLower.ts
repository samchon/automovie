import type { IAutoMovieMotionHumanBend } from "./IAutoMovieMotionHumanBend";

/**
 * A standing body lowered toward a low target by a strategy, and the trunk
 * pitch that brings the shoulder within reach: the posture transforms the bend
 * law solves its reach and balance on, split from the law so each file holds
 * one responsibility.
 */
export namespace IAutoMovieMotionHumanBendLower {
  /**
   * A strategy's solved lowering: the balance shift per unit sine of the
   * inclination and the inclination itself.
   */
  export interface ISolved {
    /** The strategy. */
    strategy: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">;

    /**
     * How far the hips move back for balance per unit sine of the inclination,
     * metres.
     */
    lean: number;

    /** The trunk's inclination, degrees. */
    pitch: number;
  }
}
