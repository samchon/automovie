import { IAutoMovieModelRecipe, IAutoMovieSceneNode, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One generated visible wall/building block and its support footprint.
 *
 * @evidence requirements/product/capability-and-content.md#product-project-owned-content Keeps an authored primitive recipe, its staged node, and occupied bounds under the project's block identity.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Makes the caller's block semantics and geometry explicit data passed into later compilation stages.
 */
export interface IAutoMovieWorldBlock {
  /**
   * Stable block identity.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's chosen block identity across its recipe, node, bounds, and validation errors.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Requires block identity as authored input instead of deriving it from position or array order.
   */
  id: string;
  /**
   * Block semantic.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains whether the project authored the primitive as a wall or building without inferring semantics from its dimensions.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Carries the caller-selected block role as an explicit output field for downstream decisions.
   */
  kind: "wall" | "building";
  /**
   * Primitive recipe registered with production design.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Preserves the project's archetype, dimensions, palette, and representation choices as its model recipe.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Emits the complete primitive recipe that the builder consumes rather than hiding construction parameters in the helper.
   */
  recipe: IAutoMovieModelRecipe;
  /**
   * Static scene node using the builder-owned runtime model id.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Retains the project's grounded placement as a scene node bound to the builder-owned runtime model identity.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Exposes the derived translation and runtime-model reference as plain output consumed by shot construction.
   */
  node: IAutoMovieSceneNode;
  /**
   * Exact axis-aligned occupied world volume.
   *
   * @evidence requirements/product/capability-and-content.md#product-project-owned-content Carries the exact occupied volume derived from the project's base and size beside the visible block.
   * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-input-output Publishes collision and support bounds as explicit output so validators need not reconstruct them from rendering data.
   */
  bounds: {
    min: IAutoMovieVector3;
    max: IAutoMovieVector3;
  };
}
