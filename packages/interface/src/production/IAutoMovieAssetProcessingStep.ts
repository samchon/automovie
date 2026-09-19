/**
 * One reproducible transformation applied after acquiring original bytes.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `IAutoMovieAssetProcessingStep` as the portable data boundary for the asset semantic enrichment requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `IAutoMovieAssetProcessingStep` for the asset spec element consumer links system contract.
 */
export interface IAutoMovieAssetProcessingStep {
  /**
   * Executable or tool identity, including a version when it affects output.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `tool` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `tool` for the asset spec element consumer links system contract.
   */
  tool: string;

  /**
   * Exact command or operation name.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `command` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `command` for the asset spec element consumer links system contract.
   */
  command: string;

  /**
   * Stable serializable parameters needed to reproduce the transformation.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Exposes `parameters` as the portable data boundary for the asset semantic enrichment requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-element-consumer-links Types `parameters` for the asset spec element consumer links system contract.
   */
  parameters: Record<string, string | number | boolean | null>;
}
