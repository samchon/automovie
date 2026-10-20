import { AutoMoviePrimitiveShape } from "./AutoMoviePrimitiveShape";

/**
 * Geometry generated from one compact primitive shape recipe.
 *
 * @evidence contracts/common.md#principled-implementation The primitive discriminator selects a closed shape union whose dimensions are validated before deterministic tessellation, retaining authored dimensions rather than requiring the caller to supply triangle buffers.
 * @evidence contracts/common.md#clear-and-simple-design This wrapper owns only the representation branch, while each shape arm owns its required dimensions and the model part owns its transform and material.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No prebuilt model or triangle fixture is embedded in the recipe; shape identity alone selects the general tessellation path for every subject.
 * @evidence contracts/common.md#meaningful-documentation States the generated primitive representation and identifies shape as the source of its parameters, with placement deliberately outside the geometry record.
 */
export interface IAutoMoviePrimitiveGeometry {
  /** Discriminator. */
  type: "primitive";

  /** The parametric shape and its dimensions. */
  shape: AutoMoviePrimitiveShape;
}
