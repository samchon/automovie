import { AutoMoviePrimitiveShape } from "./AutoMoviePrimitiveShape";

/**
 * Geometry defined by a parametric primitive shape.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `IAutoMoviePrimitiveGeometry` as the portable data boundary for the asset primitive freeform geometry requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `IAutoMoviePrimitiveGeometry` for the asset spec geometry inputs system contract.
 */
export interface IAutoMoviePrimitiveGeometry {
  /**
   * Discriminator.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `type` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `type` for the asset spec geometry inputs system contract.
   */
  type: "primitive";

  /**
   * The parametric shape and its dimensions.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `shape` as the portable data boundary for the asset primitive freeform geometry requirement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `shape` for the asset spec geometry inputs system contract.
   */
  shape: AutoMoviePrimitiveShape;
}
