import { IAutoMovieAssetConsumer } from "./IAutoMovieAssetConsumer";

/**
 * One downstream purpose that makes an asset part of one production.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `IAutoMovieAssetUse` as the portable data boundary for the asset semantic enrichment requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `IAutoMovieAssetUse` for the asset spec element consumer links system contract.
 */
export interface IAutoMovieAssetUse {
  /**
   * Exact production id; project-global assets repeat uses when shared.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `production` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `production` for the asset spec element consumer links system contract.
   */
  production: string;

  /**
   * Typed, addressable consumer inside that production.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `consumer` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `consumer` for the asset spec element consumer links system contract.
   */
  consumer: IAutoMovieAssetConsumer;

  /**
   * Why this production needs the asset.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `reason` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `reason` for the asset spec element consumer links system contract.
   */
  reason: string;
}
