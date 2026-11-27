/**
 * Named reflected relief nets whose phase window and directions belong to the
 * reflected instance. Runtime construction and admission remain with
 * AutoMovieHumanConicRelief in Human.
 */
export namespace IAutoMovieHumanConicRelief {
  /** An increasing phase range, radians. */
  export interface IPhaseRange {
    start: number;
    end: number;
  }

  /** A net stored as the reflection of an earlier one of its family's list. */
  export interface ITwin {
    /** The twin's own name. */
    name: string;

    /** The name of the net it reflects, which stands before it in the list. */
    twin: string;

    /** The twin's own phase window, radians. */
    phases: IPhaseRange;

    /** The twin's own unit direction of height. */
    axis: [number, number, number];

    /**
     * The twin's own turning direction; present exactly when the original has
     * one.
     */
    turn?: [number, number, number];
  }
}
