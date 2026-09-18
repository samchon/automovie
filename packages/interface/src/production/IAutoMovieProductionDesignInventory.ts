/**
 * Compact inventory returned by project inspection.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieProductionDesignInventory` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieProductionDesignInventory` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieProductionDesignInventory {
  /**
   * Whether the active production design exists.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `production` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `production` for the asset spec generation provider choice system contract.
   */
  production: boolean;
  /**
   * Model recipe ids.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `models` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `models` for the asset spec generation provider choice system contract.
   */
  models: string[];
  /**
   * Whether the project-shared world design exists.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `world` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `world` for the asset spec generation provider choice system contract.
   */
  world: boolean;
  /**
   * Formation ids.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `formations` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `formations` for the asset spec generation provider choice system contract.
   */
  formations: string[];
  /**
   * Shot contract ids.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `shots` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `shots` for the asset spec generation provider choice system contract.
   */
  shots: string[];
  /**
   * Acceptance scenario ids.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `acceptance` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `acceptance` for the asset spec generation provider choice system contract.
   */
  acceptance: string[];
}
