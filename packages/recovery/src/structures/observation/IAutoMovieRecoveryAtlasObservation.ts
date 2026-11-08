import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

/**
 * Coefficient atlas and the observer's existing chart, coverage and private reports.
 * The three report populations retain their existing opaque object contracts.
 *
 * @evidence contracts/development/design.md#principled-representation Generated atlas coefficients are separate from observation reports and the private source-incidence ledger.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named result preserves the existing four fields without deriving public types from a function or inventing report members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source-containing private records are not presented as source-free generation input; opaque report fields are not falsely claimed to have fully declared member schemas.
 * @evidence contracts/development/common.md#meaningful-documentation States generated-coordinate units, report opacity, coverage limitations and private-ledger ownership.
 */
export interface IAutoMovieRecoveryAtlasObservation {
  /** Generated coefficient geometry in the engine's metre-based atlas contract. */
  geometry: IAutoMovieBicubicAtlasGeometry;

  /** Existing opaque per-chart fitting and qualification reports. */
  charts: object[];

  /** Existing opaque selected-domain and whole-input coverage accounting. */
  coverage: object;

  /** Existing private source-observation ledger, kept separate from generation coefficients. */
  privateLedger: object[];
}
