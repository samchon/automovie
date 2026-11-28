/**
 * Early-stop decision for complete feature separation from a compiled resident
 * surface.
 *
 * This refutation-only form can reach its decision before the full walk uses
 * its shared work budget.
 */
export interface IAutoMovieMeshSeparationVerdict {
  /**
   * True when the complete feature passes the same geometric proof as a full
   * measurement with the same admitted inputs.
   */
  certified: boolean;

  /**
   * Original resident triangle ordinal that ended certification in walk order,
   * or -1 when certified. A failed attachment cap supplies its support
   * ordinal.
   */
  witness: number;
}
