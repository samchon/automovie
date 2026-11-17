/**
 * Row-major millimetre height nets for a malleolus relief window. Runtime construction and admission remain with AutoMovieHumanFootMalleolusBump in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes row-major millimetre height nets for a malleolus relief window; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Row-major millimetre height nets for a malleolus relief window. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanFootMalleolusBump; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing FootMalleolusBump contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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
