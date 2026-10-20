import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

/**
 * Coefficient atlas and the observer's existing chart, coverage and private reports.
 * The three report populations retain their existing opaque object contracts.
 *
 * @evidence contracts/common.md#principled-implementation Generated atlas coefficients are separate from observation reports and the private source-incidence ledger.
 * @evidence contracts/common.md#clear-and-simple-design One named result preserves the existing four fields without deriving public types from a function or inventing report members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-containing private records are not presented as source-free generation input; opaque report fields are not falsely claimed to have fully declared member schemas.
 * @evidence contracts/common.md#meaningful-documentation States generated-coordinate units, report opacity, coverage limitations and private-ledger ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result performs no geometry generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned atlas and reports; private ledger records may retain source observations.
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
