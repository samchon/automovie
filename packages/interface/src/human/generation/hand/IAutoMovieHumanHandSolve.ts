import type { IAutoMovieHumanHandJoints } from "./IAutoMovieHumanHandJoints";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";

/**
 * Solved hand scales, the corresponding arm/wrist law and joints, preserving
 * the arm producer's concrete result type.
 *
 * The interface package owns these declarations; AutoMovieHumanHandSolve in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHandSolve {
  /**
   * What the solve gives: the hand's scales, the arm built with them, and the
   * joints.
   */
  export interface ISolved<A extends IAutoMovieHumanHandWrist> {
    /** The hand's scales as solved, each at its measure's site. */
    measures: IAutoMovieHumanHandScales;

    /** The arm built with those scales, whatever more than the wrist it carries. */
    law: A;

    /** The knuckles and the thumb's base for those scales. */
    joints: IAutoMovieHumanHandJoints;
  }

  /**
   * The makeArm argument of AutoMovieHumanHandSolve.solve. Solve the hand's
   * scales and the wrist's circle at their measurement sites (ANSUR II and ISO
   * 7250-1 definitions), in rounds: each scale moves by its measure's ratio to
   * its input, and the measures barely couple.
   *
   * @param targets What the knuckle section read on the chains must measure
   *   for the meshed skin to measure the breadth and the hand tape (see
   *   {@link skinTargets}); absent, the inputs themselves.
   * @param diagnostics The list a round records into when the knuckle plane
   *   misses the palm; the scales then keep their value for that round.
   */
  export type SolveMakeArm<A extends IAutoMovieHumanHandWrist> = (
    measures: IAutoMovieHumanHandScales,
  ) => A;
}
