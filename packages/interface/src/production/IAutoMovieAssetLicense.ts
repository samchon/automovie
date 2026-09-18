/**
 * Optional descriptive license metadata attached to an asset.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-external-replacement Exposes `IAutoMovieAssetLicense` as the portable data boundary for the asset external replacement requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-identity-failure-compatibility Types `IAutoMovieAssetLicense` for the asset spec identity failure compatibility system contract.
 */
export interface IAutoMovieAssetLicense {
  /**
   * Descriptive license identifier.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-replacement Exposes `identifier` as the portable data boundary for the asset external replacement requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-identity-failure-compatibility Types `identifier` for the asset spec identity failure compatibility system contract.
   */
  identifier: string;
  /**
   * Source page containing the applicable license terms.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-replacement Exposes `url` as the portable data boundary for the asset external replacement requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-identity-failure-compatibility Types `url` for the asset spec identity failure compatibility system contract.
   */
  url: string;
  /**
   * Descriptive notice supplied with the asset.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-replacement Exposes `notice` as the portable data boundary for the asset external replacement requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-identity-failure-compatibility Types `notice` for the asset spec identity failure compatibility system contract.
   */
  notice?: string;
}
