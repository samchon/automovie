import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanLegCrotchFillet; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegCrotchFillet {
  /** The leg's start ring at the leg's phases.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The leg's start ring at the leg's phases.
   * @evidence contracts/development/design.md#principled-representation `points`: Points of the loop at the leg's phases. `normals`: Outward horizontal normals there. `rates`: The trunk's station derivative at each point, per mm up.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegCrotchFillet.of. Also types AutoMovieHumanLegCrotchFillet.out, AutoMovieHumanLegCrotchRoot.loop.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `normals`, `rates`, `seconds`, `edges`; callers supply the complete record.
   */
  export interface ILoop {
    /** Points of the loop at the leg's phases. */
    points: AutoMovieVector3Tuple[];

    /** Outward horizontal normals there. */
    normals: AutoMovieVector3Tuple[];

    /** The trunk's station derivative at each point, per mm up. */
    rates: AutoMovieVector3Tuple[];

    /** The trunk's second station derivative at each point, per mm squared. */
    seconds: AutoMovieVector3Tuple[];

    /** Distance along the trunk's arc to the nearer pinch; 0 off the arc. */
    edges: number[];
  }
}
