/**
 * Cylinder aligned to local Y.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `IAutoMovieCylinderShape` as the portable data boundary for the asset primitive freeform geometry requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `IAutoMovieCylinderShape` for the asset spec geometry inputs system contract.
 */
export interface IAutoMovieCylinderShape {
  /**
   * Discriminator.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `type` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `type` for the asset spec geometry inputs system contract.
   */
  type: "cylinder";

  /**
   * Radius, meters.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `radius` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `radius` for the asset spec geometry inputs system contract.
   */
  radius: number;

  /**
   * Height along local Y, meters.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `height` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `height` for the asset spec geometry inputs system contract.
   */
  height: number;
}
