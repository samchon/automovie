/**
 * One action that moves the production toward a clean compile.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieProductionNextAction` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieProductionNextAction` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieProductionNextAction {
  /**
   * Owning surface.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `owner` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `owner` for the asset spec generation provider choice system contract.
   */
  owner: "design" | "source" | "compile" | "review" | "render";
  /**
   * Exact package API or coding-agent command to run.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `action` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `action` for the asset spec generation provider choice system contract.
   */
  action: string;
  /**
   * Exact target or artifact to correct.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `target` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `target` for the asset spec generation provider choice system contract.
   */
  target: string;
  /**
   * Why this action is next.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `reason` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `reason` for the asset spec generation provider choice system contract.
   */
  reason: string;
}
