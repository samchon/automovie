/**
 * Row-major millimetre height nets for a malleolus relief window. Runtime
 * construction and admission remain with AutoMovieHumanFootMalleolusBump in
 * Human.
 */
export namespace IAutoMovieHumanFootMalleolusBump {
  /** A relief window's net. */
  export interface IBump {
    /** Rows of the net. */
    rows: number;

    /** Columns of the net. */
    columns: number;

    /** Heights over the window, row by row, mm. */
    heights: number[];
  }
}
