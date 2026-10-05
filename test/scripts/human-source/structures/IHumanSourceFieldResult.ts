/**
 * What one body field producer writes: dense rows per endpoint on the body
 * view (three values per vertex, before the nipple fill and storage rounding)
 * and its receipt.
 *
 * @author Samchon
 */
export interface IHumanSourceFieldResult {
  /** Rows per endpoint, dense over the body view's vertices. */
  rows: Record<string, Float64Array>;

  /** The producer's receipt: revision, method, parameters and readings. */
  receipt: Record<string, unknown>;
}
