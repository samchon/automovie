import type { IAutoMovieBicubicAtlasGeometry } from "..";

/**
 * Coefficient atlas and the observer's existing chart, coverage and private
 * reports. The three report populations retain their existing opaque object
 * contracts.
 */
export interface IAutoMovieRecoveryAtlasObservation {
  /** Generated coefficient geometry in the engine's metre-based atlas contract. */
  geometry: IAutoMovieBicubicAtlasGeometry;

  /** Existing opaque per-chart fitting and qualification reports. */
  charts: object[];

  /** Existing opaque selected-domain and whole-input coverage accounting. */
  coverage: object;

  /**
   * Existing private source-observation ledger, kept separate from generation
   * coefficients.
   */
  privateLedger: object[];
}
