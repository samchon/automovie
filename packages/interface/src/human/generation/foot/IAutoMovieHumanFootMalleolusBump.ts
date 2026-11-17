/** Type contracts exchanged by AutoMovieHumanFootMalleolusBump; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootMalleolusBump {
  /** A relief window's net.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A relief window's net.
   * @evidence contracts/development/design.md#principled-representation `rows`: Rows of the net. `columns`: Columns of the net. `heights`: Heights over the window, row by row, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootMalleolusBump.of. Also types AutoMovieHumanFootMalleolus.bump.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `rows`, `columns`, `heights`; callers supply the complete record.
   */
  export interface IBump {
    /** Rows of the net. */
    rows: number;

    /** Columns of the net. */
    columns: number;

    /** Heights over the window, row by row, mm. */
    heights: number[];
  }
}
