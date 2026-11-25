/** Data and callback contracts shared by the SolveHalfPlaneProgram operations. */
export namespace IAutoMovieSolveHalfPlaneProgram {
  /** A point of the plane. */
  export interface IPoint {
    /** The first coordinate. */
    x: number;

    /** The second coordinate. */
    y: number;
  }

  /** A half-plane: the points left of a directed line, the line included. */
  export interface ILine {
    /** A point on the line. */
    point: IAutoMovieSolveHalfPlaneProgram.IPoint;

    /** The line's unit direction. */
    direction: IAutoMovieSolveHalfPlaneProgram.IPoint;
  }

  /** What the program found. */
  export interface IResult {
    /** The point. */
    point: IAutoMovieSolveHalfPlaneProgram.IPoint;

    /**
     * Whether every half-plane holds at it; otherwise it violates the worst of
     * them least.
     */
    feasible: boolean;
  }
}
