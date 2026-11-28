/**
 * Increasing physical cut coordinates delimiting a requested source slab in
 * millimetres.
 */
export interface IAutoMovieRecoverySlabPair {
  /** Lower requested observed station in millimetres. */
  beforeMm: number;

  /** Upper requested observed station in millimetres, greater than beforeMm. */
  afterMm: number;
}
