/**
 * Axis-aligned rectangular box.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `IAutoMovieBoxShape` as the portable data boundary for the asset primitive freeform geometry requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `IAutoMovieBoxShape` for the asset spec geometry inputs system contract.
 */
export interface IAutoMovieBoxShape {
  /**
   * Discriminator.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `type` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `type` for the asset spec geometry inputs system contract.
   */
  type: "box";

  /**
   * Full size along local X, meters.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `width` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `width` for the asset spec geometry inputs system contract.
   */
  width: number;

  /**
   * Full size along local Y, meters.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `height` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `height` for the asset spec geometry inputs system contract.
   */
  height: number;

  /**
   * Full size along local Z, meters.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `depth` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `depth` for the asset spec geometry inputs system contract.
   */
  depth: number;
}
