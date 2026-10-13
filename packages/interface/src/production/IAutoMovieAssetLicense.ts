/** Optional descriptive license metadata attached to an asset. */
export interface IAutoMovieAssetLicense {
  /** Descriptive license identifier. */
  identifier: string;

  /** Source page containing the applicable license terms. */
  url: string;

  /** Descriptive notice supplied with the asset. */
  notice?: string;
}
