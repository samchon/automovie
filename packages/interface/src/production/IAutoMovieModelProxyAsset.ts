import { IAutoMovieGeneratedCollisionProxy } from "./IAutoMovieGeneratedCollisionProxy";
import { IAutoMovieGeneratedMeasurementProxy } from "./IAutoMovieGeneratedMeasurementProxy";

/**
 * Manifest-owned deterministic proxy data.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `IAutoMovieModelProxyAsset` as the portable data boundary for the asset semantic enrichment requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `IAutoMovieModelProxyAsset` for the asset spec element consumer links system contract.
 */
export interface IAutoMovieModelProxyAsset {
  /**
   * Proxy asset schema.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `version` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `version` for the asset spec element consumer links system contract.
   */
  version: 1;

  /**
   * Optional collision shape when cited as a collision proxy.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `collision` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `collision` for the asset spec element consumer links system contract.
   */
  collision?: IAutoMovieGeneratedCollisionProxy;

  /**
   * Optional measurement envelope when cited as a measurement proxy.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `measurement` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `measurement` for the asset spec element consumer links system contract.
   */
  measurement?: IAutoMovieGeneratedMeasurementProxy;
}
