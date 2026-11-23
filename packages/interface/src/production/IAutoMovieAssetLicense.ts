/**
 * Descriptive licence metadata supplied with an asset. Recording it preserves
 * provenance; compilation does not verify legal rights.
 */
export interface IAutoMovieAssetLicense {
  /** Descriptive license identifier. */
  identifier: string;

  /** Source page containing the applicable license terms. */
  url: string;

  /** Descriptive notice supplied with the asset. */
  notice?: string;
}
